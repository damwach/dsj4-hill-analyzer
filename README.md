# DSJ4 Hill Profile Analyzer

Browser-based tool for visualizing, editing and comparing DSJ4 ski-jumping hill XML profiles.

## Author

**Damian Wachnicki** — [@damwach](https://github.com/damwach)

## Features

- load and compare two DSJ4 XML hill profiles,
- 2D hill profile visualization,
- construction points P / K / L / U,
- XML P / K / HS distance markers,
- zoom, pan and profile measurements,
- hover readout with elevation and distance along the landing hill,
- built-in XML editor with formatting, validation and syntax highlighting,
- save edited XML back to a file.

## Usage

The project is a single-page browser application and requires no build step. Open `index.html` locally or publish it using GitHub Pages.

---

Created by Damian Wachnicki. Unofficial community tool for DSJ4 hill profile analysis.


## Experimental interactive 3D preview

The browser UI includes a geometric 3D preview using Three.js and OrbitControls.
It reuses the existing 2D profile engine and the XML profile widths (inrun b1,
landing b0/bk/ba), and redraws when parameter sliders or XML loads change the
profile. The camera can rotate, zoom, pan and export a screenshot to PNG.

**Scope:** this is an approximate geometric preview, not a DSJ4 renderer.
Terrain, 3D objects, stands, beams, railings, textures, and decorations defined
elsewhere in custom XML are not rendered yet. Landing widths are interpolated
approximately. XML export continues to use the existing editor unchanged.

The 3D view requires a WebGL-capable browser and internet access to load the
Three.js modules from CDNs. The existing 2D analyzer remains usable without 3D.
