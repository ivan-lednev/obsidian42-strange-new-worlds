import {Extension, StateField, Transaction} from "@codemirror/state";
import {
    debounce,
    MarkdownPostProcessor,
    MarkdownPreviewRenderer, MarkdownView,
    Platform,
    Plugin,
    WorkspaceLeaf
} from "obsidian";
import {buildLinksAndReferences, setPluginVariableForIndexer} from "./indexer";
import {InlineReferenceExtension, setPluginVariableForCM6InlineReferences} from "./view-extensions/references-cm6";
import {setPluginVariableForHtmlDecorations} from "./view-extensions/htmlDecorations";
import markdownPreviewProcessor, {
    setPluginVariableForMarkdownPreviewProcessor
} from "./view-extensions/references-preview";
import ReferenceGutterExtension, {setPluginVariableForCM6Gutter} from "./view-extensions/gutters-cm6";
import setHeaderWithReferenceCounts, {setPluginVariableForHeaderRefCount} from "./ui/headerRefCount";
import {SideBarPaneView, VIEW_TYPE_SNW} from "./ui/sidebar-pane";
import {SettingsTab, Settings, DEFAULT_SETTINGS} from "./ui/settingsTab";
import SnwAPI from "./snwApi";
import {getUIC_SidePane, setPluginVariableForUIC} from "./ui/components/uic-ref--parent";
import PluginCommands from "./pluginCommands";
import {setPluginVariableUIC_RefArea} from "./ui/components/uic-ref-area";
import {
    Decoration,
    DecorationSet,
    EditorView,
    WidgetType
} from "@codemirror/view";

class BacklinksWidget extends WidgetType {
    toDOM(view: EditorView): HTMLElement {
        return view.dom.createEl("div", {cls: "embedded-backlinks"}, (el) => {
            // el.createEl("h2", {text: "Linked mentions"})
            // el.createEl("ul", {}, (el) => {
            //     el.createEl("li", {text: "foo"})
            //     el.createEl("li", {text: "bar"})
            // })

            el.innerHTML = `<div class="embedded-backlinks" style="min-height: 91px;"><div class="nav-header"><div class="nav-buttons-container"><div class="clickable-icon nav-action-button" aria-label="Collapse results"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-list"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg></div><div class="clickable-icon nav-action-button" aria-label="Show more context"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-move-vertical"><polyline points="8 18 12 22 16 18"></polyline><polyline points="8 6 12 2 16 6"></polyline><line x1="12" y1="2" x2="12" y2="22"></line></svg></div><div class="clickable-icon nav-action-button" aria-label="Change sort order"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-sort-asc"><path d="M11 11h4"></path><path d="M11 15h7"></path><path d="M11 19h10"></path><path d="M9 7 6 4 3 7"></path><path d="M6 6v14"></path></svg></div><div class="clickable-icon nav-action-button" aria-label="Show search filter"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-search"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></div></div></div><div class="search-input-container" style="display: none;"><input enterkeyhint="search" type="search" spellcheck="false" placeholder="Search..."><div class="search-input-clear-button" aria-label="Clear search"></div></div><div class="backlink-pane node-insert-event" style="position: relative;"><div class="tree-item-self is-clickable" aria-label="Click to collapse"><span class="tree-item-icon collapse-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon right-triangle"><path d="M3 8L12 17L21 8"></path></svg></span><div class="tree-item-inner">Linked mentions</div><div class="tree-item-flair-outer"><span class="tree-item-flair">1</span></div></div><div class="search-result-container"><div class="search-results-children" style=""><div style="width: 1px; height: 0.1px; margin-bottom: 0px;"></div><div class="tree-item search-result" draggable="true"><div class="tree-item-self search-result-file-title is-clickable"><div class="tree-item-icon collapse-icon" style=""><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon right-triangle"><path d="M3 8L12 17L21 8"></path></svg></div><div class="tree-item-inner">open source contribution</div><div class="tree-item-flair-outer"><span class="tree-item-flair">1</span></div></div><div class="search-result-file-matches" style=""><div style="width: 1px; height: 0.1px; margin-bottom: 0px;"></div><div class="search-result-file-match"><span>- </span><span class="search-result-file-matched-text">[[codemirror]]</span></div></div></div></div></div><div class="tree-item-self is-clickable is-collapsed" aria-label="Click to expand"><span class="tree-item-icon collapse-icon is-collapsed"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon right-triangle"><path d="M3 8L12 17L21 8"></path></svg></span><div class="tree-item-inner">Unlinked mentions</div><div class="tree-item-flair-outer"><span class="tree-item-flair" style="display: none;"></span></div></div><div class="search-result-container" style="display: none;"><div class="search-results-children" style="min-height: 0px;"></div></div></div></div>`
        })
    }
}

export const backlinksField = StateField.define<DecorationSet>({
    create() {
        return Decoration.none;
    },

    update(oldState, transaction: Transaction) {
        const widget = new BacklinksWidget()

        const decoration = Decoration.widget({
            widget,
            side: 1,
            block: true
        })

        return Decoration.set([decoration.range(transaction.state.doc.length)])
    },

    provide(field: StateField<DecorationSet>) {
        return EditorView.decorations.from(field)
    }
});

export default class SNWPlugin extends Plugin {
    appName = this.manifest.name;
    appID = this.manifest.id;
    settings: Settings;
    showCountsActive: boolean;  //controls global state if the plugin is showing counters 
    lastSelectedReferenceType: string;
    lastSelectedReferenceRealLink: string;
    lastSelectedReferenceKey: string;
    lastSelectedReferenceFilePath: string;
    lastSelectedLineNumber: number;
    snwAPI: SnwAPI;
    markdownPostProcessor: MarkdownPostProcessor = null;
    editorExtensions: Extension[] = [];
    commands: PluginCommands;


    async onload(): Promise<void> {
        console.log("loading " + this.appName);

        setPluginVariableForIndexer(this);
        setPluginVariableUIC_RefArea(this);
        setPluginVariableForHtmlDecorations(this);
        setPluginVariableForCM6Gutter(this);
        setPluginVariableForHeaderRefCount(this);
        setPluginVariableForMarkdownPreviewProcessor(this);
        setPluginVariableForCM6InlineReferences(this);
        setPluginVariableForUIC(this);

        this.snwAPI = new SnwAPI(this);
        // @ts-ignore
        globalThis.snwAPI = this.snwAPI;  // API access to SNW for Templater, Dataviewjs and the console debugger

        await this.loadSettings();
        this.addSettingTab(new SettingsTab(this.app, this));

        // set current state based on startup parameters
        if ((Platform.isMobile || Platform.isMobileApp))
            this.showCountsActive = this.settings.enableOnStartupMobile;
        else
            this.showCountsActive = this.settings.enableOnStartupDesktop;

        this.commands = new PluginCommands(this);

        this.registerView(VIEW_TYPE_SNW, (leaf) => new SideBarPaneView(leaf, this));

        //initial index building
        const indexDebounce = debounce(() => {
            buildLinksAndReferences()
        }, 1000, true);

        this.registerEvent(this.app.metadataCache.on("resolve", indexDebounce));

        this.app.workspace.registerHoverLinkSource(this.appID, {
            display: this.appName,
            defaultMod: true,
        });

        this.snwAPI.settings = this.settings;

        this.registerEditorExtension(this.editorExtensions);

        this.toggleStateHeaderCount();
        this.toggleStateSNWMarkdownPreview();
        this.toggleStateSNWLivePreview();
        this.toggleStateSNWGutters();

        this.app.workspace.onLayoutReady(async () => {
            if (!this.app.workspace.getLeavesOfType(VIEW_TYPE_SNW)?.length) {
                await this.app.workspace.getRightLeaf(false).setViewState({type: VIEW_TYPE_SNW, active: false});
            }
            const resolved = this.app.metadataCache.on("resolved", async () => {
                buildLinksAndReferences();
                this.app.metadataCache.offref(resolved);
            });
        });
        // this.registerEditorExtension([backlinksField])
    }

    layoutChangeEvent = async () => {
        setHeaderWithReferenceCounts();

        // todo: iterate in one place
        this.app.workspace.iterateAllLeaves(async (leaf: WorkspaceLeaf) => {
            if (leaf.view.getViewType() !== "markdown") {
                return
            }

            const embeddedBacklinksEl = leaf.view.containerEl.find(".embedded-backlinks")

            if (!embeddedBacklinksEl) {
                return
            }

            // todo: rename. This is not only a side pane now

            const refType = "File";
            const realLink = (leaf.view as MarkdownView).file.basename;
            const key = (leaf.view as MarkdownView).file.basename;
            const filePath = (leaf.view as MarkdownView).file.path;
            const lineNu = 0

            embeddedBacklinksEl.replaceChildren(await getUIC_SidePane(refType, realLink, key, filePath, lineNu))
            embeddedBacklinksEl.create
        })

    }

    /**
     * Displays the sidebar SNW pane
     *
     * @param {string} refType
     * @param {string} key
     * @param {string} filePath
     * @param {number} lineNu
     * @memberof ThePlugin
     */
    async activateView(refType: string, realLink: string, key: string, filePath: string, lineNu: number) {
        this.lastSelectedReferenceType = refType;
        this.lastSelectedReferenceRealLink = realLink;
        this.lastSelectedReferenceKey = key;
        this.lastSelectedReferenceFilePath = filePath;
        this.lastSelectedLineNumber = lineNu;
        await (this.app.workspace.getLeavesOfType(VIEW_TYPE_SNW)[0].view as SideBarPaneView).updateView();
        this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TYPE_SNW)[0]);
    }

    /**
     * Turns on and off the reference count displayed at the top of the document in the header area
     *
     * @memberof ThePlugin
     */
    toggleStateHeaderCount(): void {
        if (this.settings.displayIncomingFilesheader && this.showCountsActive)
            this.app.workspace.on("layout-change", this.layoutChangeEvent);
        else
            this.app.workspace.off("layout-change", this.layoutChangeEvent);
    }

    /**
     * Turns on and off the SNW reference counters in Reading mode
     *
     * @memberof ThePlugin
     */
    toggleStateSNWMarkdownPreview(): void {
        if (this.settings.displayInlineReferencesMarkdown && this.showCountsActive && this.markdownPostProcessor === null) {
            this.markdownPostProcessor = this.registerMarkdownPostProcessor((el, ctx) => markdownPreviewProcessor(el, ctx));
        } else {
            MarkdownPreviewRenderer.unregisterPostProcessor(this.markdownPostProcessor);
            this.markdownPostProcessor = null;
        }
    }

    /**
     * Turns on and off the SNW reference counters in CM editor
     *
     * @memberof ThePlugin
     */
    toggleStateSNWLivePreview(): void {
        let state = this.settings.displayInlineReferencesLivePreview;

        if (state === true)
            state = this.showCountsActive;

        this.updateCMExtensionState("inline-ref", state, InlineReferenceExtension);
    }

    /**
     * Turns on and off the SNW reference counters in CM editor gutter
     *
     * @memberof ThePlugin
     */
    toggleStateSNWGutters(): void {
        let state = (Platform.isMobile || Platform.isMobileApp) ?
            this.settings.displayEmbedReferencesInGutterMobile :
            this.settings.displayEmbedReferencesInGutter;

        if (state === true)
            state = this.showCountsActive;

        this.updateCMExtensionState("gutter", state, ReferenceGutterExtension);
    }

    /**
     * Manages which CM extensions are loaded into Obsidian
     *
     * @param {string} extensionIdentifier
     * @param {boolean} extensionState
     * @param {Extension} extension
     * @memberof ThePlugin
     */
    updateCMExtensionState(extensionIdentifier: string, extensionState: boolean, extension: Extension) {
        if (extensionState == true) {
            this.editorExtensions.push(extension);
            // @ts-ignore
            this.editorExtensions[this.editorExtensions.length - 1].snwID = extensionIdentifier;
        } else {
            for (let i = 0; i < this.editorExtensions.length; i++) {
                const ext = this.editorExtensions[i];
                // @ts-ignore
                if (ext.snwID === extensionIdentifier) {
                    this.editorExtensions.splice(i, 1);
                    break;
                }
            }
        }
        this.app.workspace.updateOptions();
    }

    async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings)
    }

    onunload(): void {
        console.log("unloading " + this.appName)
        try {
            MarkdownPreviewRenderer.unregisterPostProcessor(this.markdownPostProcessor);
            this.app.workspace.unregisterHoverLinkSource(this.appID);
        } catch (error) { /* don't do anything */
        }
    }

}