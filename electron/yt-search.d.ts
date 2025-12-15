// Type declarations for yt-search module
declare module 'yt-search' {
    interface VideoResult {
        title: string
        url: string
        videoId: string
        thumbnail: string
        duration: { seconds: number; timestamp: string }
        description: string
        author: { name: string; url: string }
    }

    interface SearchResult {
        videos: VideoResult[]
        playlists: any[]
        channels: any[]
    }

    function search(query: string): Promise<SearchResult>

    export = search
}
