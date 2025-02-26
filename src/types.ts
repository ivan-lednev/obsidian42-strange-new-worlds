import { CachedMetadata, ListItemCache, Pos, TFile} from "obsidian";

declare module "obsidian" {

    interface Workspace {
        registerHoverLinkSource: (appID: string,
            appInfo: {
                display: string,
                defaultMod: boolean
            }) => void
        unregisterHoverLinkSource: (appID: string)=>void
    }

    interface FileManager {
        getAllLinkResolutions: () => Link[]
    }

    interface MetadataCache {
        metadataCache: {
            [x: string]: CachedMetadata
        }
        getLinks: () => {
            [key: string]: {
                link: string
                position: Pos
            }
        }
        iterateReferences:( cb: (sourcePath: string, reference: ReferenceCache)  => void ) => void
        isUserIgnored(path: string): boolean;
    }

    interface Vault {
        fileMap: {
            [x: string]: TFile
        }
    }
}

export interface ReferenceLocation {
    type: "block" | "heading" | "embed" | "link" | string;
    pos: number;
    count: number;
    key: string; //identifier for the reference
    link: string; // full link to reference
    attachClass: string; // allows a custom class to be attached when processing cm6 references
} 

export interface Link {
    reference: {
        link: string
        displayText: string
        position: Pos
    }
    resolvedFile: TFile
    // resolvedPaths: string[]
    ghostLink: string
    realLink: string  //the real link in the markdonw
    sourceFile: TFile 
    excludedFile: boolean;
}

export interface TransformedCachedItem {
    key: string;
    pos: Pos;
    page: string;
    type: string;
    references: Link[];
    original?: string;
    headerMatch?: string; //used for matching headers
}

export interface TransformedCache {
    blocks?: TransformedCachedItem[]
    links?: TransformedCachedItem[]
    headings?: TransformedCachedItem[]
    embeds?: TransformedCachedItem[]
    createDate?: number;   //date when cache was generated with Date.now()
    cacheMetaData?: CachedMetadata;
}
 
export interface ListItem extends ListItemCache {
    pos: number
    key: string
}

export interface Section {
    id?: string
    items?: ListItem[]
    position: Pos
    pos?: number
    type: string
}
