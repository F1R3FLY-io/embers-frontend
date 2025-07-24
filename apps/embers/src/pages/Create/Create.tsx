import { useState, useEffect } from "react";
import { Text } from "@/lib/components/Text";
import styles from "./Create.module.scss";

export default function Create() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const shouldBeDark = savedTheme ? savedTheme === "dark" : prefersDark;

    setIsDarkMode(shouldBeDark);
    updateTheme(shouldBeDark);
  }, []);

  const updateTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.remove("light-theme");
    } else {
      document.documentElement.classList.add("light-theme");
    }
    localStorage.setItem("theme", dark ? "dark" : "light");
  };

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    updateTheme(newDarkMode);
  };
  return (
    <div className={styles.page}>
      <div className={styles["header-bar"]}>
        <div className={styles["app-title"]}>
          <Text type="title" fontSize={18}>
            F1R3FLY
          </Text>
        </div>
        <div className={styles["header-right"]}>
          <div className={styles["language-dropdown"]}>
            <select className={styles.dropdown}>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
            <svg
              className={styles.chevron}
              width="12"
              height="8"
              viewBox="0 0 12 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1.5L6 6.5L11 1.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className={styles["theme-switch"]}>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={isDarkMode}
                onChange={toggleTheme}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
          <button className={styles["settings-icon"]}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 512 512"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M262.29,192.31a64,64,0,1,0,57.4,57.4A64.13,64.13,0,0,0,262.29,192.31ZM416.39,256a154.34,154.34,0,0,1-1.53,20.79l45.21,35.46A10.81,10.81,0,0,1,462.52,326l-42.77,74a10.81,10.81,0,0,1-13.14,4.59l-44.9-18.08a16.11,16.11,0,0,0-15.17,1.75A164.48,164.48,0,0,1,325,400.8a15.94,15.94,0,0,0-8.82,12.14l-6.73,47.89A11.08,11.08,0,0,1,298.77,470H213.23a11.11,11.11,0,0,1-10.69-8.87l-6.72-47.82a16.07,16.07,0,0,0-9-12.22,155.3,155.3,0,0,1-21.46-12.57,16,16,0,0,0-15.11-1.71l-44.89,18.07a10.81,10.81,0,0,1-13.14-4.58l-42.77-74a10.8,10.8,0,0,1,2.45-13.75l38.21-30a16.05,16.05,0,0,0,6-14.08c-.36-4.17-.58-8.33-.58-12.5s.21-8.27.58-12.35a16,16,0,0,0-6.07-13.94l-38.19-30A10.81,10.81,0,0,1,49.48,186l42.77-74a10.81,10.81,0,0,1,13.14-4.59l44.9,18.08a16.11,16.11,0,0,0,15.17-1.75A164.48,164.48,0,0,1,187,111.2a15.94,15.94,0,0,0,8.82-12.14l6.73-47.89A11.08,11.08,0,0,1,213.23,42h85.54a11.11,11.11,0,0,1,10.69,8.87l6.72,47.82a16.07,16.07,0,0,0,9,12.22,155.3,155.3,0,0,1,21.46,12.57,16,16,0,0,0,15.11,1.71l44.89-18.07a10.81,10.81,0,0,1,13.14,4.58l42.77,74a10.8,10.8,0,0,1-2.45,13.75l-38.21,30a16.05,16.05,0,0,0-6.05,14.08C416.17,247.67,416.39,251.83,416.39,256Z"
                stroke="currentColor"
                strokeWidth="32"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className={styles["main-content"]}>
        <div className={styles.dashboard}>
          {/* Dashboard content will be added here */}
          <div className={styles["dashboard-top"]}>
            <button
              className={`${styles["icon-button"]} ${styles["agents-button"]}`}
            >
              <svg
                className={styles["small-robot-icon"]}
                width="25"
                height="13"
                viewBox="0 0 50 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 22 A10 10 0 0 1 20 12 L25 12 A10 10 0 0 1 35 22"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                />
                <line
                  x1="33.5"
                  y1="22"
                  x2="37"
                  y2="22"
                  stroke="white"
                  strokeWidth="2"
                />
                <line
                  x1="37"
                  y1="22"
                  x2="37"
                  y2="26"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="37"
                  y1="26"
                  x2="33.5"
                  y2="26"
                  stroke="white"
                  strokeWidth="2"
                />
                <line
                  x1="35"
                  y1="26"
                  x2="35"
                  y2="28.5"
                  stroke="white"
                  strokeWidth="2"
                />
                <path
                  d="M35 26 A3 3 0 0 1 33.5 30"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="11.5"
                  y1="30"
                  x2="33.5"
                  y2="30"
                  stroke="white"
                  strokeWidth="2"
                />
                <path
                  d="M10 26 A3 3 0 0 0 11.5 30"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="11.5"
                  y1="26"
                  x2="8"
                  y2="26"
                  stroke="white"
                  strokeWidth="2"
                />
                <line
                  x1="8"
                  y1="26"
                  x2="8"
                  y2="22"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="8"
                  y1="22"
                  x2="11.5"
                  y2="22"
                  stroke="white"
                  strokeWidth="2"
                />
                <line
                  x1="22.5"
                  y1="12"
                  x2="22.5"
                  y2="6"
                  stroke="white"
                  strokeWidth="2"
                />
                <circle cx="22.5" cy="6" r="2" fill="white" />
                <circle cx="17" cy="23" r="2" fill="white" />
                <circle cx="28" cy="23" r="2" fill="white" />
              </svg>
              <span>Agents</span>
            </button>
          </div>
          <div className={styles["dashboard-column"]}>
            <div className={styles["dashboard-divider"]}></div>
            <div className={styles["dashboard-buttons"]}>
              <button className={styles["icon-button"]}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M16 13H8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M16 17H8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10 9H8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Documentation</span>
              </button>
              <button className={styles["icon-button"]}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 17L21 12L16 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 12H9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
        <div className={styles["content-area"]}>
          <div className={styles["content-header"]}>
            <Text type="title" fontSize={26}>
              Agents
            </Text>
          </div>
          <div className={styles["grid-container"]}>
            <div className={`${styles["grid-box"]} ${styles["create-box"]}`}>
              <div className={styles["robot-icon"]}>
                <svg
                  width="50"
                  height="36"
                  viewBox="0 0 50 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 22 A10 10 0 0 1 20 12 L25 12 A10 10 0 0 1 35 22"
                    stroke="#6a00ff"
                    strokeWidth="3"
                    fill="none"
                  />
                  <line
                    x1="33.5"
                    y1="22"
                    x2="37"
                    y2="22"
                    stroke="#6a00ff"
                    strokeWidth="3"
                  />
                  <line
                    x1="37"
                    y1="22"
                    x2="37"
                    y2="26"
                    stroke="#6a00ff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="37"
                    y1="26"
                    x2="33.5"
                    y2="26"
                    stroke="#6a00ff"
                    strokeWidth="3"
                  />
                  <line
                    x1="35"
                    y1="26"
                    x2="35"
                    y2="28.5"
                    stroke="#6a00ff"
                    strokeWidth="3"
                  />
                  <path
                    d="M35 26 A3 3 0 0 1 33.5 30"
                    stroke="#6a00ff"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="11.5"
                    y1="30"
                    x2="33.5"
                    y2="30"
                    stroke="#6a00ff"
                    strokeWidth="3"
                  />
                  <path
                    d="M10 26 A3 3 0 0 0 11.5 30"
                    stroke="#6a00ff"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="11.5"
                    y1="26"
                    x2="8"
                    y2="26"
                    stroke="#6a00ff"
                    strokeWidth="3"
                  />
                  <line
                    x1="8"
                    y1="26"
                    x2="8"
                    y2="22"
                    stroke="#6a00ff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="8"
                    y1="22"
                    x2="11.5"
                    y2="22"
                    stroke="#6a00ff"
                    strokeWidth="3"
                  />
                  <line
                    x1="22.5"
                    y1="12"
                    x2="22.5"
                    y2="6"
                    stroke="#6a00ff"
                    strokeWidth="3"
                  />
                  <circle cx="22.5" cy="6" r="3" fill="#6a00ff" />
                  <circle cx="17" cy="23" r="3" fill="#6a00ff" />
                  <circle cx="28" cy="23" r="3" fill="#6a00ff" />
                </svg>
              </div>
              <Text type="secondary">Create new Agent</Text>
            </div>
            {Array.from({ length: 0 }, (_, index) => (
              <div key={index + 1} className={styles["grid-box"]}>
                <Text type="secondary">{"Agent " + (index + 2)}</Text>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
