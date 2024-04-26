import { cx, css } from "@twind/core";
import { useRef, useEffect } from "preact/hooks";
import { Children } from "../types";

export const ScreenScroller = (props: { children: Children }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const $ = ref.current as HTMLDivElement;
    const N = $.children.length;
    const NF = 12;
    const TFN = {
      "ease-out": (k: number, e = 1.618) => {
        return 1 - Math.pow(1 - k, e);
      },
    };

    let i = parseInt($.style.getPropertyValue("--i")) || 0;
    let touchStartX: number = 0;
    let touchStartY: number = 0;
    let swipeDistance: number = 0;
    let touched = false;
    let tracking = false;
    let rID: number | null = null;
    let w = window.innerWidth;
    let ini: number;
    let fin: number;
    let progress: number = 0;

    // @ts-ignore
    let vx = Velocity();
    let vy = Velocity();

    function stopAnimation() {
      rID && cancelAnimationFrame(rID);
      rID = null;
    }

    function animate(cf = 0) {
      progress = ini + (fin - ini) * TFN["ease-out"](cf / NF);
      $.style.setProperty("--i", "" + progress);
      if (cf === NF) {
        stopAnimation();
        return;
      }
      // @ts-ignore
      rID = requestAnimationFrame(animate.bind(this, ++cf));
    }

    function cursor(e: any): MouseEvent {
      return e.changedTouches ? e.changedTouches[0] : e;
    }

    function touchStart(e: MouseEvent | TouchEvent) {
      if (rID) tracking = true;
      stopAnimation();
      touchStartX = cursor(e).clientX;
      touchStartY = cursor(e).clientY;
      vx.reset();
      vy.reset();
      touched = true;
      swipeDistance = 0;
    }

    const leftOrRightSwipe = (dx: number, dy: number, vx: any, vy: any) => {
      return (
        Math.abs(vy.getVelocity()) < 1000 &&
        Math.abs(vx.getVelocity()) > 300 &&
        Math.abs(90 - Math.abs((Math.atan2(dx, dy) * 180) / Math.PI)) < 25
      );
    };

    function touchMove(e: MouseEvent | TouchEvent) {
      const dx = cursor(e).clientX - touchStartX;
      const dy = cursor(e).clientY - touchStartY;
      const f = +(dx / w);
      vx.updatePosition(cursor(e).clientX);
      vy.updatePosition(cursor(e).clientY);
      swipeDistance += Math.abs(dx) + Math.abs(dy);

      if (
        (touched && swipeDistance < 300 && leftOrRightSwipe(dx, dy, vx, vy)) ||
        tracking
      ) {
        tracking = true;

        $.querySelectorAll("[data-scrolling]").forEach((el) => {
          (el as HTMLElement).style.overflowY = "hidden";
        });

        const next = (progress || i) - f;
        const isAtStart = next < 0;
        const isAtEnd = next > N - 1;
        $.style.setProperty(
          "--i",
          "" + (isAtStart ? 0 : isAtEnd ? N - 1 : next)
        );
      }
    }

    function touchEnd(e: MouseEvent | TouchEvent) {
      const dx = cursor(e).clientX - touchStartX;
      const dy = cursor(e).clientY - touchStartY;

      if (touched && tracking) {
        const s = Math.sign(dx);
        let f = +((s * dx) / w);

        ini = (progress || i) - s * f;

        if (
          (i > 0 || s < 0) &&
          (i < N - 1 || s > 0) &&
          (f > 0.5 || leftOrRightSwipe(dx, dy, vx, vy))
        ) {
          i -= s;
          f = 1 - f;
        }

        fin = i;
        if (ini > 0 && ini < N - 1) {
          animate();
        } else {
          $.style.setProperty("--i", "" + fin);
        }
        touchStartX = 0;
        touchStartY = 0;
        touched = false;
        tracking = false;
      }

      $.querySelectorAll("[data-scrolling]").forEach((el) => {
        (el as HTMLElement).style.overflowY = "scroll";
      });
    }

    Array.from($.children).forEach((el, i) => {
      el.setAttribute("data-order", i + "");
      if (el.hasAttribute("data-fixed")) {
        // @ts-ignore
        const stick = el.getAttribute("data-fixed") || "both";
        // @ts-ignore
        el.style = `z-index: 0; transform: translateX(calc(calc(-100% + calc(clamp(${
          ["both", "right"].includes(stick) ? "0" : "1"
        }, calc(var(--i, 0) - ${i - 1}), ${
          ["both", "left"].includes(stick) ? "2" : "1"
        }) * 100%))`;
      }
    });

    $.addEventListener("mousedown", touchStart, false);
    $.addEventListener("touchstart", touchStart, false);

    $.addEventListener("mousemove", touchMove, false);
    $.addEventListener("touchmove", touchMove, false);

    $.addEventListener("mouseup", touchEnd, false);
    $.addEventListener("touchend", touchEnd, false);
  }, []);

  return (
    <div
      ref={ref}
      data-scroller="true"
      style="--i: 1; --n: 5;"
      class={cx(
        css`
          flex: none;
          width: calc(var(--n) * 100%);
          height: 100%;
          display: flex;
          overflow: hidden;
          transform: translate(calc(var(--i, 0) / var(--n) * -100%));
          will-change: transform;
          & > * {
            flex: none;
            overflow: hidden;
            position: relative;
            height: 100%;
            width: 100vw;
            &:empty::before {
              content: attr(data-order);
              display: grid;
              height: 100%;
              place-items: center;
              font-family: sans-serif;
              font-size: 50vw;
            }
          }
        `
      )}
    >
      {props.children}
    </div>
  );
};

const Velocity = () => {
  const positionQueue: number[] = [];
  const timeQueue: number[] = [];

  const reset = () => {
    positionQueue.splice(0);
    timeQueue.splice(0);
  };

  const pruneQueue = (ms: number) => {
    while (timeQueue.length && timeQueue[0] < Date.now() - ms) {
      timeQueue.shift();
      positionQueue.shift();
    }
  };

  const updatePosition = (position: number) => {
    positionQueue.push(position);
    timeQueue.push(Date.now());
    pruneQueue(50);
  };

  const getVelocity = () => {
    pruneQueue(1000);
    const length = timeQueue.length;
    if (length < 2) return 0;

    const distance = positionQueue[length - 1] - positionQueue[0];
    const time = (timeQueue[length - 1] - timeQueue[0]) / 1000;

    return distance / time;
  };

  return {
    reset,
    updatePosition,
    getVelocity,
  };
};