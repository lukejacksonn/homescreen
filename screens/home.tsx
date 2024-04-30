import { useEffect, useMemo } from "preact/hooks";
import { Footer } from "../components/Footer";
import { Main } from "../components/Main";
import { Center, Nav } from "../components/Nav";
import { Screen } from "../components/Screen";
import { state } from "../state";
import { ScreenScroller } from "../components/ScreenScroller";
import { useSignal } from "@preact/signals";
import { css, cx } from "@twind/core";
import { Header } from "../components/Header";
import { Icon } from "../elements/Icon";

export default () => {
  const list = state.$installedAppsArray!.value;
  let lists = useMemo(() => {
    return [list.slice(0, 14), list.slice(14, 21), list.slice(21)];
  }, []);
  const progress = useSignal(5);
  return (
    <Screen>
      <div class="absolute inset-0 w-full h-full">
        <img src="/images/image.jpeg" class="w-full h-full" />
        <div class="absolute inset-0 w-full h-full backdrop-blur-lg" />
      </div>
      <ScreenScroller
        onProgress={(x) => (progress.value = x)}
        class={css`
          @apply relative z-20;
          &::before {
            @apply backdrop-blur-[calc(calc(1 - var(--i)) * 32px)];
          }
          &::after {
            @apply backdrop-blur-[calc(calc(var(--i) - ${lists.length}) * 32px)];
          }
        `}
      >
        <Screen class="bg-transparent z-30"></Screen>
        {lists.map(AppGrid(progress))}
        <AppLibrary />
      </ScreenScroller>
      <Footer
        transparent
        style={{
          zIndex: progress < 1 || progress > lists.length ? 0 : 30,
          transformOrigin: "top",
          transform:
            progress < 1
              ? scale(0.9, 1, progress)
              : scale(1, 0.9, progress - lists.length),
        }}
      >
        <div class="mb-1 self-center row gap-2 py-2.5 px-4 rounded-full bg-black/20 children:(w-2 h-2 rounded-full)">
          {Array.from({ length: lists.length }).map((_, i) => (
            <div
              class={`w-2 h-2 rounded-full ${
                i + 1 === Math.round(progress) ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
        <Nav>
          <Center class="gap-6 bg-black/20 py-3.5 px-4 rounded-3xl">
            <AppIcon id="mail" icon="Icon=Mail.png" i={1} />
            <AppIcon id="phone" icon="Icon=Phone.png" i={2} />
            <AppIcon id="message" icon="Icon=Message.png" i={3} />
            <AppIcon id="safari" icon="Icon=Safari.png" i={4} />
          </Center>
        </Nav>
      </Footer>
    </Screen>
  );
};

const getTween = (b, e, i) => {
  return b + (i / 99) * (e - b);
};

const scale = (a, b, c) => {
  return `scale(${getTween(a, b, Math.max(0, Math.min(c, 1)) * 100)})`;
};

const blur = css`
  &::before {
    content: "";
    position: absolute;
    z-index: -1;
    inset: calc(var(--blur-size, 100px) * -1);
    backdrop-filter: blur(var(--blur-strength, 10px));
    mask: linear-gradient(
        to top,
        transparent 0%,
        red var(--blur-size) calc(100% - var(--blur-size)),
        transparent 100%
      ),
      linear-gradient(
        to left,
        transparent 0%,
        red var(--blur-size) calc(100% - var(--blur-size)),
        transparent 100%
      );
    mask-composite: intersect;
  }
`;

const AppLibrary = () => {
  const searchFocussed = useSignal(false);
  const visualViewportHeight = useSignal(0);

  const folders = useMemo(() => {
    return state.$installedAppsArray!.value.reduce((all, one, i) => {
      const ch = Math.floor(i / 3);
      all[ch] = [].concat(all[ch] || [], one);
      return all;
    }, []);
  }, []);

  useEffect(() => {
    visualViewport.addEventListener("resize", (event) => {
      const h = event.target.height;
      visualViewportHeight.value = h;
    });
  }, []);

  return (
    <Screen class="bg-transparent z-30">
      <Header transparent>
        <Nav class="mt-4">
          <Center
            style={`--blur-size: 16px; --blur-strength: 3px;`}
            class={cx("px-4 text-(white/30 xl)", blur)}
          >
            <label class="w-full flex jcc bg-black/30 backdrop-blur-lg rounded-2xl">
              <div
                class="row aic px-3 py-1 gap-1.5 transition-all duration-300"
                style={{ width: searchFocussed.value ? "100%" : "182px" }}
              >
                <Icon id="search" size="8" class="flex-none" />
                <input
                  type="search"
                  placeholder="App Library"
                  class="w-full min-w-0 h-11 placeholder-white/30 bg-transparent font-medium outline-none"
                  onFocus={() => (searchFocussed.value = true)}
                />
              </div>
            </label>
            <button
              onClick={() => {
                searchFocussed.value = false;
              }}
              class={cx(
                "text-(base white) duration-300",
                searchFocussed.value
                  ? "w-[64px] pl-4 opacity-100"
                  : "w-0 opacity-0"
              )}
            >
              Cancel
            </button>
          </Center>
        </Nav>
      </Header>
      <Main class="pt-header">
        <div
          class="w-full flex-none grid grid-cols-2 pt-3 p-6 gap-x-4 gap-y-3 pb-safe-b transition-transform duration-500"
          style={{
            transform: searchFocussed.value ? "scale(0.95)" : "scale(1)",
          }}
        >
          {folders.map((group, i, groups) => {
            return (
              <div class="col aic gap-1 text-xs">
                <div class="grid grid-cols-2 grid-rows-2 px-2.5 py-3 gap-x-2 gap-y-2.5 bg-black/30 rounded-3xl">
                  {group.map((app, i) => {
                    const { name, ...rest } = app;
                    return <AppIcon {...rest} i={i} />;
                  })}
                  <div class="grid grid-cols-2 grid-rows-2 p-0.5 gap-x-1 gap-y-1">
                    {groups[i + 1 > groups.length - 1 ? 0 : i + 1].map(
                      (app, i) => {
                        const { name, ...rest } = app;
                        return <AppIcon {...rest} i={i} />;
                      }
                    )}
                  </div>
                </div>
                <span>Group Name</span>
              </div>
            );
          })}
        </div>
        <div
          class={cx(
            searchFocussed.value
              ? "opacity-100"
              : "opacity-0 pointer-events-none",
            `pb-[calc(100vh-${visualViewportHeight.value}px)]`,
            "h-screen backdrop-blur-xl pt-header overscroll-contain absolute inset-0 w-screen overflow-y-scroll"
          )}
        >
          <div class="col px-6 pt-2 pb-8">
            <h2 class="text-lg font-semibold">A</h2>
            {state.$installedAppsArray!.value.map((app, i) => {
              const { name, ...rest } = app;
              return (
                <div class="row aic gap-3.5">
                  <div class="w-14 aspect-square flex-none">
                    <AppIcon {...rest} i={i} />
                  </div>
                  <div class="w-full text-lg border-(b white/10) py-6">
                    {name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Main>
    </Screen>
  );
};

const AppGrid = (progress) => (apps, i, lists) => {
  const first = i === 0 && "right";
  const last = i === lists.length - 1 && "left";
  const both = first && last && "both";
  const transform =
    progress < 1
      ? scale(0.9, 1, progress)
      : scale(1, 0.9, progress - lists.length);
  return (
    <Screen class="bg-transparent" data-fixed={both || first || last}>
      <Main class="pt-safe-t" style={{ transformOrigin: "center", transform }}>
        <div class="w-full flex-none grid grid-cols-4 grid-rows-6 p-6 gap-x-6 gap-y-3">
          {apps.map((app, i) => (
            <AppIcon {...app} i={i} />
          ))}
        </div>
      </Main>
    </Screen>
  );
};

const AppIcon = (props: {
  id: string;
  name?: string;
  icon: string;
  i: number;
}) => {
  return (
    <div
      class="col aic gap-1 px-0.5 select-none"
      onClick={() => {
        const runningApps = state.$runningApps!.value;
        const runningAppsArray = state.$runningAppsArray!.value;

        const app = runningApps[props.id as keyof typeof runningApps];
        const order = Math.max(0, ...runningAppsArray.map((v) => v.order)) + 1;

        if (app) {
          state.$view!.value = "app";
          state.$runningApps!.value = {
            ...runningApps,
            [props.id]: { ...app, order },
          };
        } else {
          import(`./${props.id}`).then((mod) => {
            state.$view!.value = "app";
            state.$runningApps!.value = {
              ...state.$runningApps!.value,
              [props.id]: {
                Component: mod.default,
                order,
              },
            };
          });
        }
      }}
    >
      <img
        src={`/images/${props.icon}`}
        alt={props.name}
        class="aspect-square w-full"
      />
      {props.name && <p class="text-center text-xs">{props.name}</p>}
    </div>
  );
};
