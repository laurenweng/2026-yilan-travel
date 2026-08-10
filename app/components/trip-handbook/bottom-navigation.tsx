export type NavigationTab = "home" | "itinerary" | "backpack";

type BottomNavigationProps = {
  activeTab: NavigationTab;
  hasNewBackpackItem?: boolean;
  onChange: (tab: NavigationTab) => void;
};

const navigationItems: Array<{
  activeIcon: string;
  icon: string;
  label: string;
  tab: NavigationTab;
}> = [
  { activeIcon: "首頁_active.svg", icon: "首頁.svg", label: "首頁", tab: "home" },
  { activeIcon: "行程_active.svg", icon: "行程.svg", label: "行程", tab: "itinerary" },
  {
    activeIcon: "背包_active.svg",
    icon: "背包.svg",
    label: "我的背包",
    tab: "backpack",
  },
];

export const BottomNavigation = ({
  activeTab,
  hasNewBackpackItem = false,
  onChange,
}: BottomNavigationProps) => (
  <nav aria-label="主要導覽" className="bottom-navigation">
    {navigationItems.map((item) => {
      const isActive = activeTab === item.tab;

      return (
        <button
          aria-current={isActive ? "page" : undefined}
          className={`bottom-navigation-button${isActive ? " is-active" : ""}`}
          key={item.tab}
          onClick={() => onChange(item.tab)}
          type="button"
        >
          <Image
            alt=""
            className="bottom-navigation-icon"
            height={30}
            src={`/assets/yilan/${isActive ? item.activeIcon : item.icon}`}
            unoptimized
            width={30}
          />
          <span className="bottom-navigation-label">
            {item.label}
            {item.tab === "backpack" && hasNewBackpackItem && (
              <span
                aria-label="背包有新收藏"
                className="bottom-navigation-notification"
              >
                N
              </span>
            )}
          </span>
        </button>
      );
    })}
  </nav>
);
import Image from "next/image";
