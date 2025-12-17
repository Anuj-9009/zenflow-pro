/**
 * Search Utilities for ZenFlow
 * Includes fuzzy search and song title sanitization
 */

import Fuse from 'fuse.js';

// Type for searchable track
interface SearchableTrack {
    id: string;
    title: string;
    artist: string;
    album?: string;
}

/**
 * Create a fuzzy search instance for tracks
 */
export function createTrackSearcher<T extends SearchableTrack>(tracks: T[]) {
    return new Fuse(tracks, {
        keys: ['title', 'artist', 'album'],
        threshold: 0.4, // 0 = exact match, 1 = match anything
        ignoreLocation: true,
        includeScore: true,
        minMatchCharLength: 2,
    });
}

/**
 * Perform fuzzy search on tracks
 */
export function fuzzySearchTracks<T extends SearchableTrack>(
    tracks: T[],
    query: string
): T[] {
    if (!query || query.trim().length < 2) {
        return tracks;
    }

    const fuse = createTrackSearcher(tracks);
    const results = fuse.search(query.trim());
    return results.map(r => r.item);
}

/**
 * Clean song title for API calls (Genius, etc.)
 * Removes metadata like "Remastered", "Live", "feat.", brackets, etc.
 */
export function cleanSongTitle(title: string): string {
    if (!title) return '';

    return title
        // Remove content in parentheses: (Remastered 2023), (Live), (feat. Artist)
        .replace(/\s*\([^)]*\)\s*/g, ' ')
        // Remove content in square brackets: [Explicit], [Deluxe]
        .replace(/\s*\[[^\]]*\]\s*/g, ' ')
        // Remove common suffixes
        .replace(/\s*-\s*(Remastered|Remaster|Live|Acoustic|Radio Edit|Single Version|Album Version|Bonus Track|Deluxe|Extended|Remix)(\s+\d{4})?\s*/gi, ' ')
        // Remove "feat." and everything after
        .replace(/\s*(feat\.|ft\.|featuring)\s+.*/gi, '')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Clean artist name for API calls
 */
export function cleanArtistName(artist: string): string {
    if (!artist) return '';

    return artist
        // Remove "feat." and collaborators
        .replace(/\s*(feat\.|ft\.|featuring|&|,|and)\s+.*/gi, '')
        // Remove common suffixes
        .replace(/\s*\([^)]*\)\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Debounced search hook helper
 */
export function debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}
