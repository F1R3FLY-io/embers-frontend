const style = `
	:host {
		display: block;
		width: 100%;
	}

	.header-container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		height: 48px;
		background-color: transparent;
		border: none;
		box-sizing: border-box;
		padding: 12px 16px;
	}

	.header-title {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-weight: 400;
		font-size: 14px;
		color: #6b7280;
		letter-spacing: 0;
		line-height: 150%;
	}

	.search-container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		height: 42px;
		background-color: #2d3748;
		border: none;
		border-radius: 8px;
		box-sizing: border-box;
		padding: 9px 12px;
	}

	input {
		flex: 1;
		outline: none;
		background-color: transparent;
		color: #ffffff;
		border: none;
		padding: 0;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-weight: 400;
		font-style: normal;
		font-size: 14px;
		line-height: 150%;
		letter-spacing: 0;
		vertical-align: middle;
	}

	input::placeholder {
		color: #6b7280;
		opacity: 1;
	}

	.icon-button {
		background-color: transparent;
		border: none;
		color: #6b7280;
		padding: 0;
		font-size: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.2s;
		flex-shrink: 0;
	}

	.icon-button:hover {
		color: #9ca3af;
	}

	.search-button {
		margin-right: 8px;
	}
`;

export class SearchInput extends HTMLElement {
  private input: HTMLInputElement | null = null;
  private closeButton: HTMLElement | null = null;

  static get observedAttributes() {
    return ["placeholder"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  attributeChangedCallback(name: string, newValue: string) {
    if (name === "placeholder" && this.input) {
      this.input.placeholder = newValue || "Search...";
    }
  }

  get placeholder(): string {
    return this.getAttribute("placeholder") || "Search...";
  }

  set placeholder(value: string) {
    this.setAttribute("placeholder", value);
  }

  private render() {
    if (!this.shadowRoot) {
      return;
    }

    const placeholder = this.getAttribute("placeholder") || "Search...";

    this.shadowRoot.innerHTML = `
			<style>${style}</style>
			<div class="search-container">				
			<button type="button" class="icon-button search-button" data-icon="clear" disabled>
					<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.7627 0.482422C6.74688 0.338591 7.75143 0.431538 8.69238 0.753906C9.63333 1.07627 10.4836 1.6188 11.1729 2.33594C11.862 3.05302 12.3705 3.92404 12.6553 4.87695C12.94 5.82996 12.9933 6.83773 12.8105 7.81543C12.6278 8.79305 12.2143 9.71331 11.6045 10.499L11.3789 10.7891L14.4561 13.8662L14.5068 13.9297C14.5505 13.9975 14.574 14.0773 14.5732 14.1592C14.5723 14.2684 14.5284 14.373 14.4512 14.4502C14.3739 14.5274 14.2694 14.5713 14.1602 14.5723C14.0783 14.573 13.9985 14.5496 13.9307 14.5059L13.8672 14.4551L10.79 11.3779L10.499 11.6035C9.57527 12.3206 8.46893 12.7642 7.30566 12.8838C6.14218 13.0033 4.96839 12.7937 3.91797 12.2793C2.86759 11.7649 1.98222 10.966 1.36328 9.97363C0.744513 8.98138 0.41691 7.8354 0.416992 6.66602C0.417135 5.67143 0.654256 4.69098 1.10938 3.80664C1.56455 2.92226 2.22483 2.15921 3.03418 1.58105C3.84341 1.00305 4.7787 0.626256 5.7627 0.482422ZM6.66699 1.24902C5.95568 1.24902 5.25092 1.38893 4.59375 1.66113C3.93657 1.93334 3.3399 2.33296 2.83691 2.83594C2.33393 3.33892 1.93432 3.93559 1.66211 4.59277C1.3899 5.24995 1.25 5.95469 1.25 6.66602C1.25004 7.37712 1.39002 8.08129 1.66211 8.73828C1.93432 9.39546 2.33393 9.99311 2.83691 10.4961C3.33981 10.9989 3.93674 11.3978 4.59375 11.6699C5.25093 11.9421 5.95567 12.082 6.66699 12.082C8.10346 12.0819 9.48133 11.5118 10.4971 10.4961C11.5128 9.48034 12.0829 8.10249 12.083 6.66602C12.083 5.22957 11.5127 3.85173 10.4971 2.83594C9.48133 1.82019 8.10346 1.24911 6.66699 1.24902Z" fill="currentColor" stroke="currentColor" stroke-width="0.833333"/>
          </svg>
				</button>
				<input type="text" placeholder="${placeholder}"/>
			</div>
		`;
  }

  private setupEventListeners() {
    if (!this.shadowRoot) {
      return;
    }

    this.input = this.shadowRoot.querySelector("input");
    this.closeButton = this.shadowRoot.querySelector('[data-icon="clear"]');

    if (this.closeButton) {
      this.closeButton.addEventListener("click", () => {
        if (this.input) {
          this.input.value = "";
          this.input.focus();
        }
        this.dispatchEvent(new CustomEvent("clear"));
        this.dispatchEvent(
          new CustomEvent("search", { detail: { value: "" } }),
        );
      });
    }

    if (this.input) {
      this.input.addEventListener("input", (e) => {
        this.dispatchEvent(
          new CustomEvent("search", {
            detail: { value: (e.target as HTMLInputElement).value },
          }),
        );
      });
    }
  }
}

customElements.define("input-search", SearchInput);
