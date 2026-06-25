"use client";

import { useEffect, useState } from "react";

const SOLROCK =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAaCAYAAABLlle3AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsIAAA7CARUoSoAAAAHZSURBVEhL5ZShUgQxDIYDikfA3aI4HHId4JY3AAUo7g0OngBOgUUxKCSSc4BbieNQ7DkkDlzpnza9srS712WGGYZvJtMmbZJLNj36ayi7JrNo11SUhlfWEuma9EfEkqKCWBXq6e6QN3aN3rMyNwgsTnVHpd4v0V5eoRuzg22efxIcN+DMtrYz7I0pjVBwNdwwgiqxij1yvxPsDJDgeq+nXoa9L0mhw842jfjAOcaCXdvAr6el8diqRB9F8U1f27rAtjXmPElRBa1nPcqXibKsb80zqmpC5SvRYzWl0QObGuP6T8ZvjS/hhPs7nAzAjnPcs4TiQBhJyu3T3wkfZiZaR5W7V1NaGU1dEnBUHHB1AHacA9wPxUF8DSf22+B+ye3JKmX5Ju/td2In7PXgcGX+D0BCOQc2AVXlPW0fP/Pe0th2vyXuKWBiofOk6j2mFjr2APd8PyudYGd1duMC+c8kdK6lkbY/fA6AdtPgzbVNGORmcNiuz/meoTVxDNPW2j8PKoTALhXLGQR2r81BGivt5zmNz0/l7fFk4mngPWJ6BdgF3IdfF+pDIThbvQNaBNabqo2NsFwOnSvv28mTCN6za+MzSYErxWrUNNqmN8qkLO3ud+lU5X+C6BNc8pGwMiUt4wAAAABJRU5ErkJggg==";

const LUNATONE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAaCAYAAABLlle3AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsIAAA7CARUoSoAAAAGaSURBVEhL7ZSxUQQxDEV1dEEGEUMHm91RAh1AREoGHQAZKRElUMId2XbAXMRllLH4C/8d2Sd71wwkDG/GI6/t1bdk2fLPb7KItoUhWkuTn5bFKvb+ciVHXacDYNf3cnz+FL/m+ZuzyBXLaRGfEh3WNyeyur6Nn9MY8aLvg2g9XEE4pWXfgmwgKwHv7JVapMPw8awdOIczawH6m8f72F/pN8GaUsSlSBNBz3pgjvN2AzmlSFUUUZw9bOPQF0g5oiI2cgvHvWiLonAeBfM1OgfhXb9JNuVtaHF4iW5JZw+vEDCmLQiM/Xw8FJK2kC2OJ8zdgf5oz5l3EiPdUqR/FdGYArF6FS+9tStD9HzRbKHQ8cXdWk6DIIR/mjF9eXtbphaNqYWNYwnFK5M1BYWCCNkA0hoE1RJWLgqthXGnpYIpNfxTixLUCknPcmrH9sowemCu055GVRTp5NvL5w7Y9xibQjrtc1gTBDVRMD4EcEysEOfspmqCYEoU6LnY1BEWDOHdDVT9zhElKs7ISfYUzvLXIkq8ivyOnz+PyCcz5yNH356OxQAAAABJRU5ErkJggg==";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark = stored === "dark";
    setDark(isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      title="Toggle Solrock (light) / Lunatone (dark) mode"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        border: "3px solid var(--pc-ink)",
        borderRadius: 999,
        padding: 4,
        background: "var(--pc-card)",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <Orb src={SOLROCK} alt="Solrock" active={!dark} />
      <Orb src={LUNATONE} alt="Lunatone" active={dark} />
    </button>
  );
}

function Orb({ src, alt, active }: { src: string; alt: string; active: boolean }) {
  return (
    <span
      style={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "#fffaf0",
        opacity: active ? 1 : 0.35,
        transform: active ? "scale(1)" : "scale(0.85)",
        transition: "opacity 0.2s, transform 0.2s",
        boxShadow: active ? "0 0 0 2px var(--pc-ink) inset" : "none",
      }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={{ width: "100%", height: "100%", imageRendering: "pixelated" }}
      />
    </span>
  );
}
