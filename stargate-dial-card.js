class StargateCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._messageHandler = this._messageHandler.bind(this);
        this._rendered = false;
    }

    connectedCallback() {
        window.addEventListener("message", this._messageHandler);
    }

    disconnectedCallback() {
        window.removeEventListener("message", this._messageHandler);
    }

    setConfig(config) {
        if (!config) {
            throw new Error("Configuration invalide");
        }
        this.config = config;
        
        // Re-rendu uniquement si la structure n'a pas encore été créée
        if (!this._rendered) {
            this._render();
            this._rendered = true;
        }
    }

    set hass(hass) {
        this._hass = hass;
    }

    _render() {
        if (!this.shadowRoot) return;

        const file = this.config.file || "index.html";
        const basePath = this.config.path || "/local/community/ha-stargate-card/";
        
        let fullSrc = file;
        if (!file.startsWith("/") && !file.startsWith("http")) {
            fullSrc = `${basePath}${file}`;
        }

        const height = this.config.height || "";
        const aspectRatio = this.config.aspect_ratio || "1300 / 956";
        const title = this.config.title || "";

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    background: transparent;
                }
                ha-card {
                    width: 100%;
                    overflow: hidden;
                    background: #000000;
                    border: 1px solid rgba(79, 184, 208, 0.3);
                    border-radius: var(--ha-card-border-radius, 12px);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6), 0 0 15px rgba(79, 184, 208, 0.15);
                    display: flex;
                    flex-direction: column;
                }
                .card-header {
                    font-family: 'BankGothic', sans-serif;
                    font-size: 15px;
                    font-weight: bold;
                    letter-spacing: 1.5px;
                    color: #b4eeee;
                    padding: 12px 16px 8px;
                    text-transform: uppercase;
                    border-bottom: 1px solid rgba(79, 184, 208, 0.2);
                    background: linear-gradient(90deg, rgba(15, 38, 68, 0.7), transparent);
                }
                .iframe-container {
                    width: 100%;
                    ${height ? `height: ${height};` : `aspect-ratio: ${aspectRatio}; min-height: 380px;`}
                    position: relative;
                    background: #000;
                }
                iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                    display: block;
                    background: #000;
                }
            </style>
            <ha-card>
                ${title ? `<div class="card-header">${title}</div>` : ""}
                <div class="iframe-container">
                    <iframe src="${fullSrc}" allow="autoplay"></iframe>
                </div>
            </ha-card>
        `;

        this.iframe = this.shadowRoot.querySelector("iframe");
    }

    _messageHandler(event) {
        if (!this.iframe || event.source !== this.iframe.contentWindow) {
            return;
        }

        const data = event.data;
        if (data?.type !== "stargate_ha") {
            return;
        }

        if (!this._hass) {
            console.error("Home Assistant (hass) non initialisé.");
            return;
        }

        if (!data.service) {
            console.error("Service Home Assistant non spécifié", data);
            return;
        }

        // Supporte "script/mon_script" ou "script.mon_script"
        const serviceParts = data.service.replace(".", "/").split("/");
        const domain = serviceParts[0] || "script";
        const service = serviceParts[1] || serviceParts[0];

        const serviceData = data.payload || {
            chevron: data.chevron,
            action: data.action
        };

        this._hass.callService(domain, service, serviceData);
    }

    getCardSize() {
        return 12;
    }

    static getStubConfig() {
        return {
            type: "custom:stargate-card",
            file: "index.html"
        };
    }
}

// Alignement sur custom:stargate-card
customElements.define("stargate-card", StargateCard);

window.customCards = window.customCards || [];
window.customCards.push({
    type: "stargate-card.js",
    name: "Stargate dial Card",
    description: "Interface interactive de la Porte des Étoiles (SGC) pour Home Assistant",
    preview: true,
    documentationURL: "https://github.com/Yvrogne/ha-stargate-card"
});