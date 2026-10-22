"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/** Pose the hero drives: tilt leans the top away (radians), yaw/pitch follow the pointer. */
export type PhonePose = { tilt: number; yaw: number; pitch: number };

// the brand's lilac metal, matching the CSS phone used elsewhere on the site
const FRAME = "#CFC6EA", BUTTONS = "#BDB3DC";

// world units: the screen is 3.93 x 8.52, the same ratio as the 393 x 852 exports
const SCREEN = { w: 3.93, h: 8.52, r: 0.55 };
const GLASS = { w: 4.19, h: 8.78, r: 0.7 };
const BODY = { w: 4.33, h: 8.92, r: 0.78, depth: 0.2, bevel: 0.1 };

/**
 * A real 3D phone in three.js: brushed metal frame with depth and rounded bevels, black glass,
 * the live screen export as an unlit texture, side buttons, and studio reflections.
 * Sized so the phone body is exactly `--pw` wide, centred in its box. The CSS fallback shows until WebGL is ready.
 */
export function Phone3D({ src, alt, pose, className = "", children }: {
  src: string; alt: string; pose: React.RefObject<PhonePose>; className?: string; children?: React.ReactNode;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      const { RoundedBoxGeometry } = await import("three/examples/jsm/geometries/RoundedBoxGeometry.js");
      if (disposed) return;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      } catch {
        return; // no WebGL: the CSS phone stays
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      const canvas = renderer.domElement;
      canvas.setAttribute("aria-hidden", "true");
      canvas.className = "phone3d-canvas";
      el.appendChild(canvas);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = env;
      const key = new THREE.DirectionalLight(0xffffff, 1.6);
      key.position.set(-6, 9, 10);
      scene.add(key, new THREE.AmbientLight(0xf3effc, 0.35));

      const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 200);

      const rounded = (w: number, h: number, r: number) => {
        const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
        s.moveTo(x + r, y);
        s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
        s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
        s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
        return s;
      };
      const flat = (w: number, h: number, r: number) => {
        const g = new THREE.ShapeGeometry(rounded(w, h, r), 40);
        const p = g.attributes.position, uv = g.attributes.uv;
        for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, (p.getY(i) + h / 2) / h);
        return g;
      };

      const metal = new THREE.MeshPhysicalMaterial({ color: FRAME, metalness: 1, roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.18, envMapIntensity: 1.15 });
      const buttonMetal = metal.clone(); buttonMetal.color.set(BUTTONS);

      const phone = new THREE.Group();
      const front = BODY.depth / 2 + BODY.bevel;

      const bodyGeo = new THREE.ExtrudeGeometry(rounded(BODY.w - 2 * BODY.bevel, BODY.h - 2 * BODY.bevel, BODY.r - BODY.bevel), {
        depth: BODY.depth, bevelEnabled: true, bevelThickness: BODY.bevel, bevelSize: BODY.bevel, bevelSegments: 12, curveSegments: 40,
      });
      bodyGeo.translate(0, 0, -BODY.depth / 2);
      phone.add(new THREE.Mesh(bodyGeo, metal));

      const glass = new THREE.Mesh(flat(GLASS.w, GLASS.h, GLASS.r), new THREE.MeshPhysicalMaterial({ color: 0x07060c, roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04 }));
      glass.position.z = front + 0.002;
      phone.add(glass);

      const tex = await new THREE.TextureLoader().loadAsync(src);
      if (disposed) return;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const screen = new THREE.Mesh(flat(SCREEN.w, SCREEN.h, SCREEN.r), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
      screen.position.z = front + 0.004;
      phone.add(screen);

      const island = new THREE.Mesh(flat(1.12, 0.33, 0.165), new THREE.MeshBasicMaterial({ color: 0x050408 }));
      island.position.set(0, SCREEN.h / 2 - 0.36, front + 0.006);
      phone.add(island);

      // a faint diagonal sheen across the glass, the way a real screen catches the room
      const sheenCanvas = document.createElement("canvas");
      sheenCanvas.width = 64; sheenCanvas.height = 128;
      const sc = sheenCanvas.getContext("2d")!;
      const grad = sc.createLinearGradient(0, 0, 64, 128);
      grad.addColorStop(0, "rgba(255,255,255,0.22)"); grad.addColorStop(0.32, "rgba(255,255,255,0)");
      grad.addColorStop(0.75, "rgba(255,255,255,0)"); grad.addColorStop(1, "rgba(255,255,255,0.06)");
      sc.fillStyle = grad; sc.fillRect(0, 0, 64, 128);
      const sheen = new THREE.Mesh(flat(GLASS.w, GLASS.h, GLASS.r), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sheenCanvas), transparent: true, depthWrite: false, toneMapped: false }));
      sheen.position.z = front + 0.008;
      phone.add(sheen);

      const button = (h: number, x: number, y: number) => {
        const m = new THREE.Mesh(new RoundedBoxGeometry(0.12, h, 0.16, 4, 0.05), buttonMetal);
        m.position.set(x, y, 0);
        phone.add(m);
      };
      const side = BODY.w / 2 + 0.02;
      button(0.42, -side, 2.55);
      button(0.85, -side, 1.65);
      button(0.85, -side, 0.6);
      button(1.25, side, 1.9);

      // pivot at the foot, so the tilt leans the top back like a phone set down on a table
      const pivot = new THREE.Group();
      phone.position.y = BODY.h / 2;
      pivot.position.y = -BODY.h / 2;
      pivot.add(phone);
      scene.add(pivot);

      const size = () => {
        // render at the canvas's own CSS size (it is larger than the body), so nothing is upscaled
        const w = canvas.clientWidth, h = canvas.clientHeight, pw = el.clientWidth;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        // place the camera so the body is exactly pw pixels wide at rest
        const visibleH = (h / pw) * BODY.w;
        camera.position.set(0, 0, visibleH / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
        camera.updateProjectionMatrix();
      };
      size();
      const ro = new ResizeObserver(size);
      ro.observe(el); ro.observe(canvas);

      let visible = true;
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
      io.observe(el);

      const tick = (t: number) => {
        if (!visible) return;
        const p = pose.current;
        pivot.rotation.x = -p.tilt + p.pitch;
        pivot.rotation.y = p.yaw + Math.sin(t * 0.6) * 0.035;
        renderer.render(scene, camera);
      };
      gsap.ticker.add(tick);
      setReady(true);

      cleanup = () => {
        gsap.ticker.remove(tick);
        ro.disconnect(); io.disconnect();
        scene.traverse((o) => {
          const m = o as InstanceType<typeof THREE.Mesh>;
          if (m.isMesh) { m.geometry.dispose(); (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => mat.dispose()); }
        });
        tex.dispose(); env.dispose(); pmrem.dispose(); renderer.dispose();
        canvas.remove();
      };
    })();

    return () => { disposed = true; cleanup(); };
  }, [src, pose]);

  return (
    <div ref={host} className={`phone3d ${ready ? "is-ready" : ""} ${className}`} role="img" aria-label={alt}>
      <div className="phone3d-fallback">{children}</div>
    </div>
  );
}
