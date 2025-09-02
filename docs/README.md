# Rotation Documentation

This directory contains centralized workflow instructions and component documentation for the Rotation vinyl discovery application.

## Directory Structure

- **`workflows/`** - Step-by-step workflow instructions for major features and processes
- **`components/`** - Component-specific documentation including usage, props, and workflows  
- **`api/`** - API endpoint documentation and usage examples

## Documentation Standards

### Component Documentation
Each major component should have a workflow instruction manual covering:
- **Purpose**: What the component does
- **Usage**: How to use/integrate the component
- **Props/API**: Key interfaces and parameters
- **Workflow**: Step-by-step processes
- **Dependencies**: External services, APIs, or other components
- **Performance Notes**: Optimization considerations

### Workflow Documentation  
Each major feature should have workflow documentation covering:
- **Overview**: High-level process description
- **Step-by-Step**: Detailed implementation steps
- **Data Flow**: How data moves through the system
- **Error Handling**: Common issues and solutions
- **Performance**: Optimization strategies

### When to Create/Update Documentation
- **Creating new components**: Always create component documentation
- **Modifying existing workflows**: Update relevant workflow docs
- **Performance optimizations**: Document changes and impact
- **Bug fixes**: Update troubleshooting sections
- **API changes**: Update API documentation

## Quick Reference

- **[Naming Conventions](NAMING.md)** - Component, hook, and utility naming standards
- [Store Browsing Workflow](workflows/store-browsing.md)
- [Feed System Workflow](workflows/feed-system.md)
- [Inventory Management](workflows/inventory-management.md)
- [Audio Matching Workflow](workflows/audio-matching.md) 
- [Feed Component](components/feed-template.md)
- [Store Management](components/store-management.md)