export interface paths {
    "/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create an administrator database session */
        post: operations["AuthController_login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AuthController_logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AuthController_me"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/media": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AdminMediaController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/media/images": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AdminMediaController_upload"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/media/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["AdminMediaController_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/media/{id}/content": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["MediaController_content"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/site-profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["SiteProfileController_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/site-profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AdminSiteProfileController_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["AdminSiteProfileController_update"];
        trace?: never;
    };
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["HealthController_check"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/books": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List visible books in display order */
        get: operations["BooksController_findAll"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/books": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List all books, including hidden records */
        get: operations["AdminBooksController_findAll"];
        put?: never;
        /** Create a book */
        post: operations["AdminBooksController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/books/reorder": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Atomically update book display positions */
        patch: operations["AdminBooksController_reorder"];
        trace?: never;
    };
    "/admin/books/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get one book for administration */
        get: operations["AdminBooksController_findOne"];
        put?: never;
        post?: never;
        /** Delete a book */
        delete: operations["AdminBooksController_remove"];
        options?: never;
        head?: never;
        /** Update a book */
        patch: operations["AdminBooksController_update"];
        trace?: never;
    };
    "/games/playing": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Current visible game confirmed by Steam; never infer presence from browsing */
        get: operations["GamesController_playing"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/games": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List visible games in display order */
        get: operations["GamesController_findAll"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/games": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List all games, including hidden records */
        get: operations["AdminGamesController_findAll"];
        put?: never;
        /** Create a game */
        post: operations["AdminGamesController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/games/reorder": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Atomically update game display positions */
        patch: operations["AdminGamesController_reorder"];
        trace?: never;
    };
    "/admin/games/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get one game for administration */
        get: operations["AdminGamesController_findOne"];
        put?: never;
        post?: never;
        /** Delete a game */
        delete: operations["AdminGamesController_remove"];
        options?: never;
        head?: never;
        /** Update a game */
        patch: operations["AdminGamesController_update"];
        trace?: never;
    };
    "/admin/steam/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["SteamController_status"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/steam/library": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["SteamController_library"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/steam/sync": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Sync configured owner library; durable cooldown also applies to manual sync */
        post: operations["SteamController_sync"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/steam/link-matches": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Link only unique exact normalized titles; preserve existing links and editorial fields */
        post: operations["SteamController_link"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/photos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List visible photos in display order */
        get: operations["PhotosController_findAll"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/photos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List all photos, including hidden records */
        get: operations["AdminPhotosController_findAll"];
        put?: never;
        /** Create a photo */
        post: operations["AdminPhotosController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/photos/reorder": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Atomically update photo display positions */
        patch: operations["AdminPhotosController_reorder"];
        trace?: never;
    };
    "/admin/photos/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get one photo for administration */
        get: operations["AdminPhotosController_findOne"];
        put?: never;
        post?: never;
        /** Delete a photo */
        delete: operations["AdminPhotosController_remove"];
        options?: never;
        head?: never;
        /** Update a photo */
        patch: operations["AdminPhotosController_update"];
        trace?: never;
    };
    "/skills": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List visible skills */
        get: operations["SkillsController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/skills": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List all skills for administration */
        get: operations["AdminSkillsController_list"];
        put?: never;
        /** Create a skill */
        post: operations["AdminSkillsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/skills/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a skill by id */
        get: operations["AdminSkillsController_get"];
        put?: never;
        post?: never;
        /** Delete a skill */
        delete: operations["AdminSkillsController_delete"];
        options?: never;
        head?: never;
        /** Update a skill */
        patch: operations["AdminSkillsController_update"];
        trace?: never;
    };
    "/admin/skills/reorder": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update skill sort positions in one transaction */
        patch: operations["AdminSkillsController_reorder"];
        trace?: never;
    };
    "/social-links": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List visible social links */
        get: operations["SocialLinksController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/social-links": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List all social links for administration */
        get: operations["AdminSocialLinksController_list"];
        put?: never;
        /** Create a social link */
        post: operations["AdminSocialLinksController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/social-links/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a social link by id */
        get: operations["AdminSocialLinksController_get"];
        put?: never;
        post?: never;
        /** Delete a social link */
        delete: operations["AdminSocialLinksController_delete"];
        options?: never;
        head?: never;
        /** Update a social link */
        patch: operations["AdminSocialLinksController_update"];
        trace?: never;
    };
    "/admin/social-links/reorder": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update social-link sort positions in one transaction */
        patch: operations["AdminSocialLinksController_reorder"];
        trace?: never;
    };
    "/creations/layout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CreationsController_layout"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/creations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CreationsController_feed"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/creations/layout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AdminCreationsController_layout"];
        put: operations["AdminCreationsController_saveLayout"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/creations/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AdminCreationsController_status"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/creations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AdminCreationsController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/creations/import-x": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AdminCreationsController_importX"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/creations/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["AdminCreationsController_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        LoginDto: {
            /** @example admin@example.com */
            email: string;
            password: string;
        };
        AdminIdentityDto: {
            id: number;
            /** Format: email */
            email: string;
        };
        LoginResponseDto: {
            admin: components["schemas"]["AdminIdentityDto"];
            /** Format: date-time */
            expiresAt: string;
        };
        MediaResponseDto: {
            id: number;
            /** Format: uri */
            url: string;
            mimeType: string;
            sizeBytes: number;
            width: number | null;
            height: number | null;
            altText: string | null;
            /** @enum {string} */
            kind: "IMAGE" | "PHOTO_ORIGINAL" | "PHOTO_THUMBNAIL";
            /** Format: date-time */
            createdAt: string;
        };
        MediaUploadResponseDto: {
            asset: components["schemas"]["MediaResponseDto"];
        };
        PhotoUploadResponseDto: {
            original: components["schemas"]["MediaResponseDto"];
            thumbnail: components["schemas"]["MediaResponseDto"];
        };
        Object: Record<string, never>;
        MediaPageResponseDto: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
            items: components["schemas"]["MediaResponseDto"][];
        };
        SiteProfileResponseDto: {
            displayName: string;
            role: string;
            heroTitlePrefix: string;
            heroDescription: string;
            learningNote: string;
            footerMessage: string;
            avatar: components["schemas"]["MediaResponseDto"] | null;
            /** Format: date-time */
            updatedAt: string;
        };
        AdminSiteProfileResponseDto: {
            displayName: string;
            role: string;
            heroTitlePrefix: string;
            heroDescription: string;
            learningNote: string;
            footerMessage: string;
            avatar: components["schemas"]["MediaResponseDto"] | null;
            /** Format: date-time */
            updatedAt: string;
            /** @enum {number} */
            id: 1;
            avatarMediaId: number | null;
            /** Format: date-time */
            createdAt: string;
        };
        UpdateSiteProfileDto: {
            displayName?: string;
            role?: string;
            heroTitlePrefix?: string;
            heroDescription?: string;
            learningNote?: string;
            footerMessage?: string;
            avatarMediaId?: Record<string, never> | null;
        };
        HealthResponseDto: {
            /** @enum {string} */
            status: "ok";
            /** @enum {string} */
            database: "up";
            /** Format: date-time */
            timestamp: string;
        };
        BookMediaResponseDto: {
            id: number;
            /** Format: uri */
            url: string;
            mimeType: string;
            sizeBytes: number;
            width: number | null;
            height: number | null;
            altText: string | null;
            /** @enum {string} */
            kind: "IMAGE" | "PHOTO_ORIGINAL" | "PHOTO_THUMBNAIL";
            /** Format: date-time */
            createdAt: string;
        };
        BookResponseDto: {
            id: number;
            title: string;
            author: string;
            coverMediaId: number;
            cover: components["schemas"]["BookMediaResponseDto"];
            accent: string;
            sourceName: string | null;
            /** Format: uri */
            sourceUrl: string | null;
            readingOrder: number;
            readingNotes: string;
            /** Format: date-time */
            lastReadAt: string | null;
            /** Format: date-time */
            startedAt: string | null;
            /** Format: date-time */
            finishedAt: string | null;
            progress: number;
            isVisible: boolean;
            sortOrder: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        BookPageResponseDto: {
            items: components["schemas"]["BookResponseDto"][];
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
        ReorderItemDto: {
            id: number;
            sortOrder: number;
        };
        ReorderDto: {
            items: components["schemas"]["ReorderItemDto"][];
        };
        CreateBookDto: {
            title: string;
            author: string;
            coverMediaId: number;
            /** @example #d7a536 */
            accent: string;
            sourceName?: string | null;
            /** @example https://example.com/book */
            sourceUrl?: string | null;
            readingOrder: number;
            /**
             * @description Plain-text reading notes; an empty string clears the notes.
             * @default
             */
            readingNotes: string;
            /** Format: date-time */
            lastReadAt?: string | null;
            /** Format: date-time */
            startedAt?: string | null;
            /** Format: date-time */
            finishedAt?: string | null;
            /** @default 0 */
            progress: number;
            /** @default true */
            isVisible: boolean;
            /** @default 0 */
            sortOrder: number;
        };
        UpdateBookDto: {
            title?: string;
            author?: string;
            coverMediaId?: number;
            /** @example #d7a536 */
            accent?: string;
            sourceName?: string | null;
            /** @example https://example.com/book */
            sourceUrl?: string | null;
            readingOrder?: number;
            /**
             * @description Plain-text reading notes; an empty string clears the notes.
             * @default
             */
            readingNotes: string;
            /** Format: date-time */
            lastReadAt?: string | null;
            /** Format: date-time */
            startedAt?: string | null;
            /** Format: date-time */
            finishedAt?: string | null;
            /** @default 0 */
            progress: number;
            /** @default true */
            isVisible: boolean;
            /** @default 0 */
            sortOrder: number;
        };
        SteamAccountPlaytimeDto: {
            accountName: string;
            playtimeMinutes: number;
            stale: boolean;
        };
        SteamGameDto: {
            appId: number;
            name: string;
            /** @description Exact Steam total, in minutes */
            playtimeMinutes: number;
            playtimeTwoWeeksMinutes: number | null;
            /** Format: date-time */
            lastPlayedAt: string | null;
            /** Format: date-time */
            syncedAt: string;
            stale: boolean;
            /** @description One or more configured accounts have no visible snapshot */
            incomplete: boolean;
            accountBreakdown: components["schemas"]["SteamAccountPlaytimeDto"][];
            /** Format: uri */
            storeUrl: string;
        };
        GameMediaResponseDto: {
            id: number;
            /** Format: uri */
            url: string;
            mimeType: string;
            sizeBytes: number;
            width: number | null;
            height: number | null;
            altText: string | null;
            /** @enum {string} */
            kind: "IMAGE" | "PHOTO_ORIGINAL" | "PHOTO_THUMBNAIL";
            /** Format: date-time */
            createdAt: string;
        };
        GameResponseDto: {
            steamAppId: number | null;
            steam: components["schemas"]["SteamGameDto"] | null;
            /** @description Custom hours: positive values override Steam; 0 uses Steam. Legacy field name retained for compatibility. */
            manualPlaytimeHours: number;
            id: number;
            title: string;
            platform: string | null;
            coverMediaId: number;
            cover: components["schemas"]["GameMediaResponseDto"];
            rating: number;
            /** @description Effective display hours: custom hours when positive, otherwise aggregated Steam minutes rounded down to hours, or 0 when unavailable. Never add custom and Steam hours. */
            playtimeHours: number;
            /** @default false */
            usesController: boolean;
            likeLevel: number;
            comment: string | null;
            isVisible: boolean;
            sortOrder: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        GamePresenceResponseDto: {
            /** @enum {string} */
            source: "steam";
            /** @enum {string} */
            state: "playing" | "idle" | "unavailable" | "unconfigured";
            game: components["schemas"]["GameResponseDto"] | null;
            /** @description Sum of effective hours of all visible games */
            totalGameHours: number;
            /** Format: date-time */
            updatedAt: string;
            /** Format: date-time */
            expiresAt: string;
            refreshAfterMs: number;
        };
        GamePageResponseDto: {
            items: components["schemas"]["GameResponseDto"][];
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
        CreateGameDto: {
            /** @description App ID from the configured owner Steam library; null unlinks */
            steamAppId?: number | null;
            title: string;
            platform?: string | null;
            coverMediaId: number;
            /** @example 8.5 */
            rating: number;
            /** @description Custom hours: positive values override Steam; 0 uses Steam hours. */
            playtimeHours: number;
            /**
             * @description Whether this game is played with a controller
             * @default false
             */
            usesController: boolean;
            likeLevel: number;
            comment?: string | null;
            /** @default true */
            isVisible: boolean;
            /** @default 0 */
            sortOrder: number;
        };
        UpdateGameDto: {
            /** @description App ID from the configured owner Steam library; null unlinks */
            steamAppId?: number | null;
            title?: string;
            platform?: string | null;
            coverMediaId?: number;
            /** @example 8.5 */
            rating?: number;
            /** @description Custom hours: positive values override Steam; 0 uses Steam hours. */
            playtimeHours?: number;
            /**
             * @description Whether this game is played with a controller
             * @default false
             */
            usesController: boolean;
            likeLevel?: number;
            comment?: string | null;
            /** @default true */
            isVisible: boolean;
            /** @default 0 */
            sortOrder: number;
        };
        SteamAccountStatusDto: {
            name: string;
            steamId: string;
            syncing: boolean;
            libraryVisible: boolean;
            gameCount: number;
            lastSuccessAt: string | null;
            nextSyncAt: string | null;
            lastErrorCode: string | null;
        };
        SteamStatusDto: {
            accounts: components["schemas"]["SteamAccountStatusDto"][];
            enabled: boolean;
            steamId: string | null;
            intervalSeconds: number;
            syncing: boolean;
            libraryVisible: boolean;
            gameCount: number;
            /** Format: date-time */
            lastSuccessAt: string | null;
            /** Format: date-time */
            nextSyncAt: string | null;
            lastErrorCode: string | null;
        };
        SteamLibraryPageDto: {
            items: components["schemas"]["SteamGameDto"][];
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
        SteamLinkResultDto: {
            linkedGameIds: number[];
        };
        PhotoMediaResponseDto: {
            id: number;
            /** Format: uri */
            url: string;
            mimeType: string;
            sizeBytes: number;
            width: number | null;
            height: number | null;
            altText: string | null;
            /** @enum {string} */
            kind: "IMAGE" | "PHOTO_ORIGINAL" | "PHOTO_THUMBNAIL";
            /** Format: date-time */
            createdAt: string;
        };
        PhotoResponseDto: {
            id: number;
            originalMediaId: number;
            original: components["schemas"]["PhotoMediaResponseDto"];
            thumbnailMediaId: number;
            thumbnail: components["schemas"]["PhotoMediaResponseDto"];
            alt: string;
            title: string;
            description: string;
            /** Format: date-time */
            capturedAt: string | null;
            isVisible: boolean;
            sortOrder: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        PhotoPageResponseDto: {
            items: components["schemas"]["PhotoResponseDto"][];
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
        CreatePhotoDto: {
            originalMediaId: number;
            thumbnailMediaId: number;
            alt: string;
            title: string;
            description: string;
            /** Format: date-time */
            capturedAt?: string | null;
            /** @default true */
            isVisible: boolean;
            /** @default 0 */
            sortOrder: number;
        };
        UpdatePhotoDto: {
            originalMediaId?: number;
            thumbnailMediaId?: number;
            alt?: string;
            title?: string;
            description?: string;
            /** Format: date-time */
            capturedAt?: string | null;
            /** @default true */
            isVisible: boolean;
            /** @default 0 */
            sortOrder: number;
        };
        SkillResponseDto: {
            id: number;
            /** @example TypeScript */
            name: string;
            /** @example typescript */
            iconKey: string;
            iconMediaId: number | null;
            darkIconMediaId: number | null;
            icon: components["schemas"]["MediaResponseDto"] | null;
            darkIcon: components["schemas"]["MediaResponseDto"] | null;
            sortOrder: number;
            isVisible: boolean;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        SkillPageResponseDto: {
            items: components["schemas"]["SkillResponseDto"][];
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
        CreateSkillDto: {
            /** @example TypeScript */
            name: string;
            /** @example typescript */
            iconKey: string;
            iconMediaId?: number | null;
            darkIconMediaId?: number | null;
            /** @default 0 */
            sortOrder: number;
            /** @default true */
            isVisible: boolean;
        };
        UpdateSkillDto: {
            /** @example TypeScript */
            name?: string;
            /** @example typescript */
            iconKey?: string;
            iconMediaId?: number | null;
            darkIconMediaId?: number | null;
            /** @default 0 */
            sortOrder: number;
            /** @default true */
            isVisible: boolean;
        };
        SocialLinkResponseDto: {
            id: number;
            /** @example GitHub */
            name: string;
            /** @example github */
            platform: string;
            /**
             * Format: uri
             * @example https://github.com/vo1dPro
             */
            url: string;
            /** @example github */
            iconKey: string;
            iconMediaId: number | null;
            darkIconMediaId: number | null;
            icon: components["schemas"]["MediaResponseDto"] | null;
            darkIcon: components["schemas"]["MediaResponseDto"] | null;
            sortOrder: number;
            isVisible: boolean;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        SocialLinkPageResponseDto: {
            items: components["schemas"]["SocialLinkResponseDto"][];
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
        CreateSocialLinkDto: {
            /** @example GitHub */
            name: string;
            /** @example github */
            platform: string;
            /**
             * Format: uri
             * @example https://github.com/vo1dPro
             */
            url: string;
            /** @example github */
            iconKey: string;
            iconMediaId?: number | null;
            darkIconMediaId?: number | null;
            /** @default 0 */
            sortOrder: number;
            /** @default true */
            isVisible: boolean;
        };
        UpdateSocialLinkDto: {
            /** @example GitHub */
            name?: string;
            /** @example github */
            platform?: string;
            /**
             * Format: uri
             * @example https://github.com/vo1dPro
             */
            url?: string;
            /** @example github */
            iconKey?: string;
            iconMediaId?: number | null;
            darkIconMediaId?: number | null;
            /** @default 0 */
            sortOrder: number;
            /** @default true */
            isVisible: boolean;
        };
        ImportCreationDto: {
            /** @example https://x.com/vo1dZzz/status/1234567890123456789 */
            url: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    AuthController_login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginDto"];
            };
        };
        responses: {
            /** @description HttpOnly cookie set */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LoginResponseDto"];
                };
            };
            /** @description Credentials are invalid */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AuthController_logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Session deleted and cookie cleared */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AuthController_me: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminIdentityDto"];
                };
            };
        };
    };
    AdminMediaController_list: {
        parameters: {
            query?: {
                page?: components["schemas"]["Object"];
                pageSize?: components["schemas"]["Object"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MediaPageResponseDto"];
                };
            };
        };
    };
    AdminMediaController_upload: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": {
                    /** Format: binary */
                    file: string;
                    /**
                     * @default IMAGE
                     * @enum {string}
                     */
                    purpose?: "IMAGE" | "PHOTO" | "ICON";
                    altText?: string;
                };
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MediaUploadResponseDto"] | components["schemas"]["PhotoUploadResponseDto"];
                };
            };
        };
    };
    AdminMediaController_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Unreferenced media asset deleted */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MediaController_content: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "image/webp": string;
                    "image/png": string;
                    "image/jpeg": string;
                };
            };
            /** @description Database image not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SiteProfileController_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SiteProfileResponseDto"];
                };
            };
        };
    };
    AdminSiteProfileController_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminSiteProfileResponseDto"];
                };
            };
        };
    };
    AdminSiteProfileController_update: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateSiteProfileDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminSiteProfileResponseDto"];
                };
            };
        };
    };
    HealthController_check: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthResponseDto"];
                };
            };
            /** @description PostgreSQL is unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BooksController_findAll: {
        parameters: {
            query?: {
                page?: components["schemas"]["Object"];
                pageSize?: components["schemas"]["Object"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BookPageResponseDto"];
                };
            };
        };
    };
    AdminBooksController_findAll: {
        parameters: {
            query?: {
                page?: components["schemas"]["Object"];
                pageSize?: components["schemas"]["Object"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BookPageResponseDto"];
                };
            };
            /** @description A valid administrator session is required */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminBooksController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateBookDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BookResponseDto"];
                };
            };
            /** @description Input or cover media kind is invalid */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A valid administrator session is required */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Cover media asset not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminBooksController_reorder: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReorderDto"];
            };
        };
        responses: {
            /** @description Book display positions updated */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Duplicate IDs or display positions */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A valid administrator session is required */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description At least one book does not exist */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminBooksController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BookResponseDto"];
                };
            };
            /** @description A valid administrator session is required */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Book not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminBooksController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Book deleted */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A valid administrator session is required */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Book not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminBooksController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateBookDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BookResponseDto"];
                };
            };
            /** @description Input or cover media kind is invalid */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A valid administrator session is required */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Book or cover media asset not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    GamesController_playing: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GamePresenceResponseDto"];
                };
            };
        };
    };
    GamesController_findAll: {
        parameters: {
            query?: {
                page?: components["schemas"]["Object"];
                pageSize?: components["schemas"]["Object"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GamePageResponseDto"];
                };
            };
        };
    };
    AdminGamesController_findAll: {
        parameters: {
            query?: {
                page?: components["schemas"]["Object"];
                pageSize?: components["schemas"]["Object"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GamePageResponseDto"];
                };
            };
            /** @description A valid administrator session is required */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminGamesController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateGameDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GameResponseDto"];
                };
            };
            /** @description Input or cover media kind is invalid */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A valid administrator session is required */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Cover media asset not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminGamesController_reorder: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReorderDto"];
            };
        };
        responses: {
            /** @description Game display positions updated */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Duplicate IDs or display positions */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A valid administrator session is required */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description At least one game does not exist */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminGamesController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GameResponseDto"];
                };
            };
            /** @description A valid administrator session is required */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Game not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminGamesController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Game deleted */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A valid administrator session is required */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Game not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminGamesController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateGameDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GameResponseDto"];
                };
            };
            /** @description Input or cover media kind is invalid */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A valid administrator session is required */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Game or cover media asset not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SteamController_status: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SteamStatusDto"];
                };
            };
        };
    };
    SteamController_library: {
        parameters: {
            query?: {
                page?: components["schemas"]["Object"];
                pageSize?: components["schemas"]["Object"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SteamLibraryPageDto"];
                };
            };
        };
    };
    SteamController_sync: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SteamStatusDto"];
                };
            };
        };
    };
    SteamController_link: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SteamLinkResultDto"];
                };
            };
        };
    };
    PhotosController_findAll: {
        parameters: {
            query?: {
                page?: components["schemas"]["Object"];
                pageSize?: components["schemas"]["Object"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PhotoPageResponseDto"];
                };
            };
        };
    };
    AdminPhotosController_findAll: {
        parameters: {
            query?: {
                page?: components["schemas"]["Object"];
                pageSize?: components["schemas"]["Object"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PhotoPageResponseDto"];
                };
            };
            /** @description A valid administrator session is required */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminPhotosController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreatePhotoDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PhotoResponseDto"];
                };
            };
            /** @description Input or media relationship is invalid */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A valid administrator session is required */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Original or thumbnail media asset not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminPhotosController_reorder: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReorderDto"];
            };
        };
        responses: {
            /** @description Photo display positions updated */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Duplicate IDs or display positions */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A valid administrator session is required */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description At least one photo does not exist */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminPhotosController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PhotoResponseDto"];
                };
            };
            /** @description A valid administrator session is required */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Photo not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminPhotosController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Photo deleted */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A valid administrator session is required */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Photo not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminPhotosController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdatePhotoDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PhotoResponseDto"];
                };
            };
            /** @description Input or media relationship is invalid */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A valid administrator session is required */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Photo or media asset not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SkillsController_list: {
        parameters: {
            query?: {
                page?: components["schemas"]["Object"];
                pageSize?: components["schemas"]["Object"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SkillPageResponseDto"];
                };
            };
        };
    };
    AdminSkillsController_list: {
        parameters: {
            query?: {
                page?: components["schemas"]["Object"];
                pageSize?: components["schemas"]["Object"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SkillPageResponseDto"];
                };
            };
            /** @description Administrator session is missing or expired */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminSkillsController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateSkillDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SkillResponseDto"];
                };
            };
            /** @description Administrator session is missing or expired */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminSkillsController_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SkillResponseDto"];
                };
            };
            /** @description Administrator session is missing or expired */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Skill not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminSkillsController_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Skill deleted */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Administrator session is missing or expired */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Skill not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminSkillsController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateSkillDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SkillResponseDto"];
                };
            };
            /** @description Administrator session is missing or expired */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Skill not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminSkillsController_reorder: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReorderDto"];
            };
        };
        responses: {
            /** @description Display positions updated atomically */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description The reorder payload is invalid */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Administrator session is missing or expired */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A skill id was not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SocialLinksController_list: {
        parameters: {
            query?: {
                page?: components["schemas"]["Object"];
                pageSize?: components["schemas"]["Object"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SocialLinkPageResponseDto"];
                };
            };
        };
    };
    AdminSocialLinksController_list: {
        parameters: {
            query?: {
                page?: components["schemas"]["Object"];
                pageSize?: components["schemas"]["Object"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SocialLinkPageResponseDto"];
                };
            };
            /** @description Administrator session is missing or expired */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminSocialLinksController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateSocialLinkDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SocialLinkResponseDto"];
                };
            };
            /** @description Administrator session is missing or expired */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminSocialLinksController_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SocialLinkResponseDto"];
                };
            };
            /** @description Administrator session is missing or expired */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Social link not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminSocialLinksController_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Social link deleted */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Administrator session is missing or expired */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Social link not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminSocialLinksController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateSocialLinkDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SocialLinkResponseDto"];
                };
            };
            /** @description Administrator session is missing or expired */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Social link not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminSocialLinksController_reorder: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReorderDto"];
            };
        };
        responses: {
            /** @description Display positions updated atomically */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description The reorder payload is invalid */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Administrator session is missing or expired */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A social-link id was not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CreationsController_layout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CreationsController_feed: {
        parameters: {
            query?: {
                page?: components["schemas"]["Object"];
                pageSize?: components["schemas"]["Object"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminCreationsController_layout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminCreationsController_saveLayout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminCreationsController_status: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminCreationsController_list: {
        parameters: {
            query?: {
                page?: components["schemas"]["Object"];
                pageSize?: components["schemas"]["Object"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminCreationsController_importX: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ImportCreationDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminCreationsController_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
}
