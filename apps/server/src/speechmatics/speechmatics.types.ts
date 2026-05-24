/** Alternative transcription option from Speechmatics */
export interface SpeechmaticsAlternative {
  content: string;
  confidence: number;
  language?: string;
  speaker?: string;
  display?: object;
  tags?: string[];
}

/** A single transcription result from Speechmatics (word or punctuation) */
export interface SpeechmaticsResult {
  type: 'word' | 'punctuation' | 'entity';
  start_time: number;
  end_time: number;
  alternatives: SpeechmaticsAlternative[];
  /** Only for punctuation - which word it attaches to */
  attaches_to?: 'previous' | 'next' | 'both' | 'none';
  /** Only for punctuation - is this end of sentence */
  is_eos?: boolean;
  channel?: string;
  volume?: number;
  written_form?: object[];
  spoken_form?: object[];
}

/** Job information from Speechmatics */
export interface SpeechmaticsJob {
  created_at: string;
  data_name: string;
  duration: number;
  id: string;
  text_name?: string;
  tracking?: object;
}

/** Language pack info from Speechmatics */
export interface SpeechmaticsLanguagePackInfo {
  adapted?: boolean;
  itn?: boolean;
  language_description?: string;
  word_delimiter?: string;
  writing_direction?: string;
}

/** Metadata from Speechmatics transcription */
export interface SpeechmaticsMetadata {
  created_at: string;
  type: 'alignment' | 'transcription';
  transcription_config?: {
    language?: string;
    operating_point?: string;
    [key: string]: unknown;
  };
  language_pack_info?: SpeechmaticsLanguagePackInfo;
  orchestrator_version?: string;
}

/** Full Speechmatics JSON v2 transcription response */
export interface SpeechmaticsResponse {
  format: string;
  job: SpeechmaticsJob;
  metadata: SpeechmaticsMetadata;
  results: SpeechmaticsResult[];
  speakers?: object[];
  translations?: Record<string, object[]>;
  summary?: object;
  sentiment_analysis?: object;
  topics?: object;
  chapters?: object[];
  audio_events?: object[];
  audio_event_summary?: object;
}
