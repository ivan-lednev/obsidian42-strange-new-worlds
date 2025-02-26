import {gutter, GutterMarker, } from "@codemirror/view";
import { BlockInfo, EditorView } from "@codemirror/view";
import { editorInfoField, stripHeading } from "obsidian";
import { htmlDecorationForReferencesElement } from "src/view-extensions/htmlDecorations";
import { getSNWCacheByFile, parseLinkTextToFullPath } from "src/indexer";
import SNWPlugin from "src/main";

let thePlugin: SNWPlugin;

export function setPluginVariableForCM6Gutter(plugin: SNWPlugin) {
    thePlugin = plugin;
}

const referenceGutterMarker = class extends GutterMarker {
    referenceCount: number;
    referenceType: string;
    key: string;    //a unique identifer for the reference
    realLink: string;
    filePath: string;
    addCssClass: string; //if a reference need special treatment, this class can be assigned

    constructor(refCount: number, cssclass: string, realLink: string,  key:string, filePath: string, addCSSClass: string){
        super();
        this.referenceCount = refCount;
        this.referenceType = cssclass;
        this.realLink = realLink;
        this.key = key;
        this.filePath = filePath;
        this.addCssClass = addCSSClass;
    }

    toDOM() {
        return htmlDecorationForReferencesElement(this.referenceCount, this.referenceType, this.realLink, this.key, this.filePath, this.addCssClass, 0);
    }
}

const emptyMarker = new class extends GutterMarker {
    toDOM() { return document.createTextNode("øøø") }
  }

const ReferenceGutterExtension = gutter({
    class: "snw-gutter-ref",
    lineMarker(editorView: EditorView, line: BlockInfo) {

        if(thePlugin.snwAPI.enableDebugging.GutterEmbedCounter) 
            thePlugin.snwAPI.console("ReferenceGutterExtension(EditorView, BlockInfo)", editorView, line )

        const mdView = editorView.state.field( editorInfoField );
        
        if(!mdView.file) return;
        const transformedCache = getSNWCacheByFile(mdView.file);

        // check if the page is to be ignored
        if(transformedCache?.cacheMetaData?.frontmatter?.["snw-file-exclude"]===true) return;
        if(transformedCache?.cacheMetaData?.frontmatter?.["snw-canvas-exclude-edit"]===true) return;

        const embedsFromMetaDataCache = mdView.app.metadataCache.getFileCache(mdView.file)?.embeds;

        if(embedsFromMetaDataCache?.length >= thePlugin.settings.minimumRefCountThreshold) {
            const lineNumberInFile = editorView.state.doc.lineAt(line.from).number;
            for (const embed of embedsFromMetaDataCache) {
                if(embed.position.start.line +1 === lineNumberInFile) {
                    for (const ref of transformedCache.embeds) {
                        if(ref?.references[0]?.excludedFile!=true && ref?.references.length>0 && ref?.pos.start.line+1 === lineNumberInFile) {
                            const lineToAnalyze = editorView.state.doc.lineAt(line.from).text.trim(); 
                            if(lineToAnalyze.startsWith("!")){
                                const strippedLineToAnalyze = lineToAnalyze.replace("![[","").replace("]]","")
                                let lineFromFile = "";
                                if(strippedLineToAnalyze.startsWith("#")){
                                    lineFromFile = mdView.file.path.replace(".md","") + stripHeading(strippedLineToAnalyze);
                                } else {
                                    lineFromFile = parseLinkTextToFullPath(strippedLineToAnalyze);
                                }
                                if( lineFromFile === ref.key) {
                                    if(thePlugin.snwAPI.enableDebugging.GutterEmbedCounter) 
                                        thePlugin.snwAPI.console("ReferenceGutterExtension New gutter", ref.references.length, "embed", ref.key, ref.key, "snw-embed-special" );
                                    return new referenceGutterMarker(ref.references.length, "embed", ref.references[0].realLink, ref.key, ref.references[0].resolvedFile.path.replace(".md",""), "snw-embed-special");
                                }
                            }
                        }
                    }
                }
            }
        }
    }, 
    initialSpacer: () => emptyMarker
})

export default ReferenceGutterExtension;
