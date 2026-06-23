"use client";
// Standalone embed view of the Project Intake form. Renders the same React
// component the in-app page uses (so there is one source of truth) but
// without the sidebar, topbar or the surrounding hub chrome — ready to be
// dropped into an <iframe> on any other site.
//
// Suggested snippet for the host site:
//
//   <iframe
//     src="https://<command-space>/embed/project-intake"
//     style="border:0;width:100%;min-height:1200px"
//     allow="clipboard-write"
//   ></iframe>
//   <script>
//     window.addEventListener("message", (e) => {
//       if (e?.data?.type === "selected-frame-intake:height") {
//         document.querySelectorAll("iframe").forEach((f) => {
//           if (f.src.includes("/embed/project-intake")) f.style.height = e.data.height + "px";
//         });
//       }
//     });
//   </script>

import React from "react";
import ProjectIntakePage from "../../project-intake/ProjectIntakePage";
import EmbedHeightReporter from "../EmbedHeightReporter";

export default function ProjectIntakeEmbed() {
  return (
    <div
      style={{
        background: "#F5F4F1",
        minHeight: "100vh",
        padding: "28px 24px 48px",
      }}
    >
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <ProjectIntakePage />
      </div>
      <EmbedHeightReporter />
    </div>
  );
}
