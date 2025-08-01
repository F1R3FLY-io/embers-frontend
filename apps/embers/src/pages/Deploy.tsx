import Stepper from "@/lib/components/Stepper";
import { Text } from "@/lib/components/Text";

type DeployProps = {
  agentAddress?: string;
  agentDescription?: string;
  agentName?: string;
  agentVersion?: string;
  blockchainShard?: string;
};

export default function Deploy({
  agentAddress = "#7839937799911",
  agentDescription = "Enter agent description",
  agentName = "BioMatch",
  agentVersion = "1.0.0",
  blockchainShard = "shard://ai-health.open.mettacycle.net",
}: DeployProps) {
  return (
    <div
      style={{
        maxWidth: "560px",
        paddingLeft: "148px",
        paddingTop: "100px",
        rowGap: "16px",
      }}
    >
      <Text fontSize={40} type="title">
        Create AI Agent
      </Text>
      <div style={{ marginTop: "32px" }}>
        <Stepper
          currentStep={3}
          labels={["Create", "Configure", "Deploy"]}
          steps={3}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          marginTop: "24px",
        }}
      >
        <div>
          <Text fontSize={32} type="title">
            Deploy {agentName} Agent
          </Text>
          <div style={{ marginTop: "16px" }}>
            <Text fontSize={16} type="secondary">
              Review the details and confirm where and how your agent will run.
            </Text>
          </div>
        </div>
        <div style={{ marginTop: "16px" }}>
          <Text fontSize={20} type="title">
            Agent Details
          </Text>
          <div
            style={{
              alignItems: "baseline",
              display: "flex",
              gap: "8px",
              marginTop: "12px",
            }}
          >
            <Text fontSize={12} style={{ minWidth: "120px" }} type="secondary">
              Agent address
            </Text>
            <Text color="#F1F3F5" fontSize={12} type="secondary">
              {agentAddress}
            </Text>
          </div>
          <div
            style={{
              alignItems: "baseline",
              display: "flex",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            <Text fontSize={12} style={{ minWidth: "120px" }} type="secondary">
              Blockchain shard
            </Text>
            <Text color="#F1F3F5" fontSize={12} type="secondary">
              {blockchainShard}
            </Text>
          </div>
          <div
            style={{
              backgroundColor: "#2E3F52",
              height: "1px",
              marginTop: "24px",
            }}
          />
          <div style={{ marginTop: "24px" }}>
            <Text fontSize={12} type="secondary">
              Agent name
            </Text>
            <input
              className="placeholder-secondary"
              placeholder={agentName}
              style={{
                backgroundColor: "#1E2936",
                border: "none",
                borderRadius: "8px",
                boxSizing: "border-box",
                color: "#F1F3F5",
                fontFamily: "Manrope, sans-serif",
                fontSize: "14px",
                marginTop: "8px",
                padding: "12px 16px",
                width: "100%",
              }}
              type="text"
            />
          </div>
          <div style={{ marginTop: "24px" }}>
            <Text fontSize={12} type="secondary">
              Agent description
            </Text>
            <textarea
              className="placeholder-secondary"
              placeholder={agentDescription}
              style={{
                backgroundColor: "#1E2936",
                border: "none",
                borderRadius: "8px",
                boxSizing: "border-box",
                color: "#F1F3F5",
                fontFamily: "Manrope, sans-serif",
                fontSize: "14px",
                marginTop: "8px",
                minHeight: "120px",
                padding: "12px 16px",
                resize: "none",
                width: "100%",
              }}
            />
          </div>
          <div style={{ marginTop: "24px" }}>
            <Text fontSize={20} type="title">
              Welcome Interface
            </Text>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                marginTop: "24px",
              }}
            >
              <div>
                <Text fontSize={12} type="secondary">
                  Welcome message
                </Text>
                <textarea
                  className="placeholder-secondary"
                  placeholder="Enter welcome message"
                  style={{
                    backgroundColor: "#1E2936",
                    border: "none",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                    color: "#F1F3F5",
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "14px",
                    marginTop: "8px",
                    minHeight: "120px",
                    padding: "12px 16px",
                    resize: "none",
                    width: "100%",
                  }}
                />
              </div>
              <div>
                <Text fontSize={12} type="secondary">
                  Input prompt
                </Text>
                <textarea
                  className="placeholder-secondary"
                  placeholder="Enter input prompt"
                  style={{
                    backgroundColor: "#1E2936",
                    border: "none",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                    color: "#F1F3F5",
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "14px",
                    marginTop: "8px",
                    minHeight: "120px",
                    padding: "12px 16px",
                    resize: "none",
                    width: "100%",
                  }}
                />
              </div>
            </div>
          </div>
          <div style={{ marginTop: "24px" }}>
            <Text fontSize={20} type="title">
              Version & Notes
            </Text>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                marginTop: "24px",
              }}
            >
              <div>
                <Text fontSize={12} type="secondary">
                  Version
                </Text>
                <input
                  className="placeholder-secondary"
                  placeholder={agentVersion}
                  style={{
                    backgroundColor: "#1E2936",
                    border: "none",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                    color: "#F1F3F5",
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "14px",
                    marginTop: "8px",
                    padding: "12px 16px",
                    width: "100%",
                  }}
                  type="text"
                />
              </div>
              <div>
                <Text fontSize={12} type="secondary">
                  Notes
                </Text>
                <textarea
                  className="placeholder-secondary"
                  placeholder="Enter deployment notes or comments"
                  style={{
                    backgroundColor: "#1E2936",
                    border: "none",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                    color: "#F1F3F5",
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "14px",
                    marginTop: "8px",
                    minHeight: "120px",
                    padding: "12px 16px",
                    resize: "none",
                    width: "100%",
                  }}
                />
              </div>
            </div>
          </div>
          <div
            style={{
              alignItems: "center",
              borderBottom: "1px solid #2E3F52",
              display: "flex",
              justifyContent: "space-between",
              marginTop: "24px",
              paddingBottom: "24px",
            }}
          >
            <button
              style={{
                backgroundColor: "transparent",
                border: "none",
                borderRadius: "4px",
                color: "#F1F3F5",
                cursor: "pointer",
                fontFamily: "Manrope, sans-serif",
                fontSize: "14px",
                padding: "12px 24px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#1E2936";
                e.currentTarget.style.borderColor = "#3E4F62";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "#2E3F52";
              }}
            >
              Back
            </button>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                style={{
                  alignItems: "center",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: "4px",
                  color: "#F1F3F5",
                  cursor: "pointer",
                  display: "flex",
                  fontFamily: "Manrope, sans-serif",
                  fontSize: "14px",
                  gap: "8px",
                  padding: "12px 24px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#1E2936";
                  e.currentTarget.style.borderColor = "#3E4F62";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "#2E3F52";
                }}
              >
                {/* TODO(aidan): replace svg with public icon once icons PR is merged */}
                <svg
                  fill="none"
                  height="16"
                  viewBox="0 0 24 24"
                  width="16"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17 3H7C5.9 3 5 3.9 5 5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V5C19 3.9 18.1 3 17 3ZM17 19H7V5H17V19Z"
                    fill="currentColor"
                  />
                  <path
                    d="M9 7H15V9H9V7ZM9 11H15V13H9V11ZM9 15H13V17H9V15Z"
                    fill="currentColor"
                  />
                </svg>
                Save as Draft
              </button>
              <button
                style={{
                  backgroundColor: "#8B5CF6",
                  border: "none",
                  borderRadius: "4px",
                  color: "white",
                  cursor: "pointer",
                  fontFamily: "Manrope, sans-serif",
                  fontSize: "14px",
                  padding: "12px 24px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#7C3AED";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#8B5CF6";
                }}
              >
                Deploy
              </button>
            </div>
          </div>
          <div
            style={{
              alignItems: "center",
              display: "flex",
              justifyContent: "space-between",
              marginTop: "16px",
              paddingBottom: "16px",
            }}
          >
            <div style={{ display: "flex", gap: "8px" }}>
              <div
                style={{ display: "inline-block", position: "relative" }}
                onMouseEnter={(e) => {
                  const select = e.currentTarget.querySelector(
                    "select",
                  ) as HTMLSelectElement;
                  const icon = e.currentTarget.querySelector(
                    "img",
                  ) as HTMLImageElement;
                  select.style.color = "#f1f3f5";
                  icon.style.filter = "brightness(0) invert(1)";
                }}
                onMouseLeave={(e) => {
                  const select = e.currentTarget.querySelector(
                    "select",
                  ) as HTMLSelectElement;
                  const icon = e.currentTarget.querySelector(
                    "img",
                  ) as HTMLImageElement;
                  select.style.color = "#93a5b7";
                  icon.style.filter =
                    "brightness(0) saturate(100%) invert(67%) sepia(8%) saturate(1234%) hue-rotate(182deg) brightness(89%) contrast(86%)";
                }}
              >
                {/* TODO(aidan): move to components */}
                <select
                  style={{
                    appearance: "none",
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: "4px",
                    boxSizing: "border-box",
                    color: "#93a5b7",
                    cursor: "pointer",
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "14px",
                    height: "32px",
                    MozAppearance: "none",
                    MozUserSelect: "none",
                    msUserSelect: "none",
                    outline: "none",
                    padding: "0px 24px 0px 0px",
                    transition: "color 0.2s ease",
                    userSelect: "none",
                    WebkitAppearance: "none",
                    WebkitUserSelect: "none",
                  }}
                  onFocus={(e) => {
                    e.target.style.outline = "none";
                  }}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
                <div
                  style={{
                    pointerEvents: "none",
                    position: "absolute",
                    right: "6px",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                >
                  <img
                    alt="dropdown"
                    height="20"
                    src="/src/public/icons/chevron-down.svg"
                    style={{
                      filter:
                        "brightness(0) saturate(100%) invert(67%) sepia(8%) saturate(1234%) hue-rotate(182deg) brightness(89%) contrast(86%)",
                      transition: "filter 0.2s ease",
                    }}
                    width="20"
                  />
                </div>
              </div>
            </div>
            <div style={{ alignItems: "center", display: "flex", gap: "8px" }}>
              <Text fontSize={14} type="secondary">
                Having trouble?
              </Text>
              <a
                href="#"
                style={{
                  color: "#208BFE",
                  cursor: "pointer",
                  fontFamily: "Manrope, sans-serif",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = "underline";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = "none";
                }}
              >
                Contact support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
