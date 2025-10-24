import type { TrackableField } from '../types';

export type Trackables = {
    gtm: TrackableField;
    ga4: TrackableField;
    google_ads: TrackableField;
    msa: TrackableField;
};

/**
 * Creates an empty trackable field with default values
 */
export function createEmptyTrackableField(): TrackableField {
    return {
        status: 'Unknown',
        notes: '',
        example_site: '',
        documentation: '',
    };
}

/**
 * Creates a complete trackables object with all fields initialized
 */
export function createEmptyTrackables(): Trackables {
    return {
        gtm: createEmptyTrackableField(),
        ga4: createEmptyTrackableField(),
        google_ads: createEmptyTrackableField(),
        msa: createEmptyTrackableField(),
    };
}
