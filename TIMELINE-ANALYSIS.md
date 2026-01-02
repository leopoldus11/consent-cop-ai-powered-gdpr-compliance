# Request Lifecycle Visualization - Deep Analysis

## Current State Analysis

### What We Have Now
- Simple dot-based visualization
- Domain grouping with count badges
- Basic pre/post consent distinction
- Minimal information density
- No request duration/timing visualization
- Missing waterfall-style layout

### Critical Issues
1. **Information Loss**: Grouping hides individual request details
2. **No Temporal Context**: Can't see request duration or timing relationships
3. **Missing Visual Hierarchy**: All requests look the same
4. **No Request Type Differentiation**: Script/XHR/Pixel all look identical
5. **Poor Scalability**: Breaks down with many requests
6. **No Performance Context**: Can't see which requests are slow/fast

## Industry Standards Comparison

### Chrome DevTools Network Tab
- **Waterfall Chart**: Each request = horizontal bar
- **Time Scale**: X-axis shows time progression
- **Domain Rows**: Each domain gets its own row
- **Color Coding**: By resource type (script=blue, xhr=green, etc.)
- **Bar Width**: Represents request duration
- **Bar Position**: Shows start time
- **Hover Details**: Full request info on hover

### WebPageTest Waterfall
- **Vertical Layout**: Domains stacked vertically
- **Horizontal Bars**: Time flows left to right
- **Color Coding**: By content type and status
- **Connection Lines**: Shows request dependencies
- **Milestone Markers**: DOMContentLoaded, Load, etc.

### Datadog APM Traces
- **Span Visualization**: Each request = span
- **Nested Structure**: Shows parent-child relationships
- **Color by Service**: Different colors per service
- **Duration Bars**: Visual representation of time
- **Critical Path Highlighting**: Shows bottlenecks

## Design Principles to Apply

1. **Waterfall Layout**: Industry standard for network visualization
2. **Domain Grouping**: Logical organization (like DevTools)
3. **Color Semantics**: 
   - Request type (script/xhr/pixel)
   - Status (violation/allowed)
   - Risk level (high/medium/low)
4. **Time Scale**: Clear x-axis with markers
5. **Information Density**: Show maximum info without clutter
6. **Visual Hierarchy**: Important requests stand out
7. **Interactivity**: Hover/click for details

## Proposed Design

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ Request Lifecycle                                        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Time Scale: 0s ────── 5s ────── 10s ────── 15s] │ │
│ │                                                      │ │
│ │ assets.adobedtm.com  ████████████                   │ │
│ │                      ████                            │ │
│ │                      ████████                        │ │
│ │                                                      │ │
│ │ dpm.demdex.net       ████                            │ │
│ │                                                      │ │
│ │ ────────────────────│CONSENT│───────────────────── │ │
│ │                                                      │ │
│ │ metrics.dertour.de              ████████            │ │
│ │                                 ████                │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Key Features
1. **Waterfall Bars**: Each request = horizontal bar
   - Left edge = start time
   - Width = duration (or min width if very fast)
   - Color = type + status
   
2. **Domain Rows**: Each domain in its own row
   - Grouped logically
   - Collapsible for many domains
   
3. **Consent Milestone**: Vertical line with label
   - Clear visual break
   - Color-coded zones (red left, green right)
   
4. **Request Type Colors**:
   - Script: Blue
   - XHR: Green  
   - Pixel: Orange
   - Violation overlay: Red border/glow
   
5. **Time Scale**: Top axis with markers
   - Major markers every 5s
   - Minor markers every 1s
   
6. **Interactive Elements**:
   - Hover: Show full details
   - Click: Expand to see all requests in domain
   - Tooltip: Domain, count, types, timing

### Visual Enhancements
- **Gradient Background**: Subtle gradient from red (pre) to green (post)
- **Shadow Effects**: Depth for bars
- **Smooth Animations**: On load and hover
- **Responsive**: Adapts to different screen sizes
- **Accessibility**: High contrast, keyboard navigation


