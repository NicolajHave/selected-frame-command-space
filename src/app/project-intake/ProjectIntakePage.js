"use client";
import React from "react";

const C = {
  steel: "#8A8D8F",
  steelL: "#B8BBBE",
  steelD: "#5C5F61",
  oak: "#C4944A",
  surface: "#F5F4F1",
  surfaceD: "#ECEAE5",
  white: "#FFFFFF",
  black: "#1A1A1A",
  text: "#2C2C2C",
  textS: "#6B6B6B",
};

const Title = ({ children, sub }) => (
  <div style={{ marginBottom: 24 }}>
    <h2 style={{ fontSize: 22, fontWeight: 400, color: C.text, fontFamily: "'Cormorant Garamond',serif", margin: 0 }}>
      {children}
    </h2>
    {sub && <p style={{ fontSize: 13, color: C.textS, margin: "4px 0 0" }}>{sub}</p>}
  </div>
);

const FORM_SRC =
  "https://forms.office.com/Pages/ResponsePage.aspx?id=uZ_bmCv1Y06D2XlczS38yr72WmGquEZIqsedpLOdJNZUQUM3VU1YR1JCVFpPM0tBRUtaT1JaV0k4Uy4u&embed=true";

export default function ProjectIntakePage() {
  return (
    <div style={{ maxWidth: 920 }}>
      <Title sub="Start a new Selected Frame / Shop-In-Shop project.">Project Intake</Title>

      <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, maxWidth: 720, marginBottom: 24 }}>
        Project Intake is the future starting point for new Selected Frame and Shop-In-Shop projects. The purpose is to
        collect the right project information from the beginning, reduce back-and-forth communication and create a
        stronger foundation for briefing, quotation and execution.
      </div>

      {/* Work in progress */}
      <div
        style={{
          background: C.white,
          border: `1px solid ${C.surfaceD}`,
          borderLeft: `3px solid ${C.oak}`,
          borderRadius: 8,
          padding: "18px 22px",
          marginBottom: 28,
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: C.oak,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            border: `1px solid ${C.oak}55`,
            borderRadius: 4,
            padding: "4px 8px",
            marginTop: 1,
          }}
        >
          Work in progress
        </div>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.65 }}>
          This page is currently work in progress. For now, the briefing form below is embedded from Microsoft Forms.
          In a later version, this will become a native Command Space intake flow that creates a structured project
          brief and filecard draft.
        </div>
      </div>

      {/* Embedded Microsoft Form */}
      <div
        style={{
          background: C.white,
          border: `1px solid ${C.surfaceD}`,
          borderRadius: 10,
          overflow: "hidden",
          marginBottom: 32,
        }}
      >
        <div
          style={{
            padding: "14px 22px",
            borderBottom: `1px solid ${C.surfaceD}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: "1px" }}>
            Project Briefing Form
          </div>
          <a
            href={FORM_SRC.replace("&embed=true", "")}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, fontWeight: 500, color: C.oak, textDecoration: "none" }}
          >
            Open in new tab →
          </a>
        </div>
        <div style={{ position: "relative", width: "100%", height: "75vh", minHeight: 480, background: C.surface }}>
          <iframe
            title="Selected Frame Project Briefing Form"
            src={FORM_SRC}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            allowFullScreen
          />
        </div>
      </div>

      {/* Future capability */}
      <div style={{ borderTop: `1px solid ${C.surfaceD}`, paddingTop: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: C.text, fontFamily: "'Cormorant Garamond',serif", marginBottom: 8 }}>
          Future Intake Flow
        </div>
        <div style={{ fontSize: 13, color: C.textS, lineHeight: 1.7, maxWidth: 720 }}>
          In a future version, this page will be developed into a native briefing flow inside Command Space. The
          ambition is to generate a structured project brief, support filecard creation and send the completed project
          intake directly to the relevant internal stakeholders.
        </div>
      </div>
    </div>
  );
}
