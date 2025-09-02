-- Migration 012: Create batch ingest RPC function
-- Handles batch insertion of listings with YouTube matches in single transaction

-- Create function for batch ingesting listings with audio matches
CREATE OR REPLACE FUNCTION ingest_listings(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    store_username text;
    listings jsonb;
    listing jsonb;
    release_data jsonb;
    track_matches jsonb;
    match_item jsonb;
    release_id bigint;
    inserted_count int := 0;
    updated_count int := 0;
    error_count int := 0;
    result jsonb;
BEGIN
    -- Extract parameters from payload
    store_username := payload->>'store_username';
    listings := payload->'listings';
    
    -- Validate input
    IF store_username IS NULL OR listings IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Missing store_username or listings in payload'
        );
    END IF;
    
    -- Process each listing in a transaction
    FOR listing IN SELECT * FROM jsonb_array_elements(listings)
    LOOP
        BEGIN
            release_data := listing->'release';
            track_matches := listing->'track_matches';
            release_id := (release_data->>'id')::bigint;
            
            -- Insert/update release
            INSERT INTO releases (
                discogs_id, store_username, title, artist, year, label, catno, thumb,
                genres, styles, tracklist, images, discogs_uri, discogs_resource_url,
                price_value, price_currency, condition, sleeve_condition, comments,
                has_audio_matches, audio_match_count, last_updated
            ) VALUES (
                release_id,
                store_username,
                release_data->>'title',
                release_data->>'artist',
                (release_data->>'year')::int,
                release_data->>'label',
                release_data->>'catno',
                release_data->>'thumb',
                release_data->'genres',
                release_data->'styles',
                release_data->'tracklist',
                release_data->'images',
                release_data->>'uri',
                release_data->>'resource_url',
                listing->>'price_value',
                listing->>'price_currency',
                listing->>'condition',
                listing->>'sleeve_condition',
                listing->>'comments',
                CASE WHEN track_matches IS NOT NULL AND jsonb_array_length(track_matches) > 0 THEN true ELSE false END,
                CASE WHEN track_matches IS NOT NULL THEN jsonb_array_length(track_matches) ELSE 0 END,
                NOW()
            )
            ON CONFLICT (discogs_id) 
            DO UPDATE SET
                title = EXCLUDED.title,
                artist = EXCLUDED.artist,
                price_value = EXCLUDED.price_value,
                price_currency = EXCLUDED.price_currency,
                condition = EXCLUDED.condition,
                sleeve_condition = EXCLUDED.sleeve_condition,
                comments = EXCLUDED.comments,
                last_updated = NOW();
            
            -- Check if this was an insert or update
            IF FOUND AND (SELECT discogs_id FROM releases WHERE discogs_id = release_id) IS NOT NULL THEN
                IF (SELECT last_updated FROM releases WHERE discogs_id = release_id) = NOW()::date THEN
                    updated_count := updated_count + 1;
                ELSE
                    inserted_count := inserted_count + 1;
                END IF;
            END IF;
            
            -- Insert track matches if provided
            IF track_matches IS NOT NULL AND jsonb_array_length(track_matches) > 0 THEN
                FOR match_item IN SELECT * FROM jsonb_array_elements(track_matches)
                LOOP
                    INSERT INTO track_matches (
                        release_id, track_index, platform, match_url, confidence, approved, verified_by
                    ) VALUES (
                        release_id,
                        (match_item->>'track_index')::int,
                        match_item->>'platform',
                        match_item->>'url',
                        (match_item->>'confidence')::numeric,
                        (match_item->>'confidence')::numeric >= 80, -- Auto-approve high confidence
                        'batch_ingest'
                    )
                    ON CONFLICT (release_id, track_index)
                    DO UPDATE SET
                        platform = EXCLUDED.platform,
                        match_url = EXCLUDED.match_url,
                        confidence = EXCLUDED.confidence,
                        approved = EXCLUDED.approved,
                        verified_by = EXCLUDED.verified_by,
                        verified_at = NOW(),
                        updated_at = NOW();
                END LOOP;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            -- Log error but continue processing other listings
            error_count := error_count + 1;
            RAISE NOTICE 'Error processing release %: %', release_id, SQLERRM;
        END;
    END LOOP;
    
    -- Return results
    result := jsonb_build_object(
        'success', true,
        'stats', jsonb_build_object(
            'inserted', inserted_count,
            'updated', updated_count,
            'errors', error_count,
            'total_processed', inserted_count + updated_count + error_count
        )
    );
    
    RETURN result;
END;
$$;