import type { ZodiosOptions } from "@zodios/core";
import { createApiClient as create_chatAudioUpload } from './chat_audio_upload_controller';
import { createApiClient as create_chatImageUpload } from './chat_image_upload_controller';
import { createApiClient as create_chatSession } from './chat_session_controller';
import { createApiClient as create_turnCredential } from './turn_credential_controller';

export function createChatFacade(baseUrl: string, options?: ZodiosOptions) {
  return {
  chatSession: create_chatSession(baseUrl, options),
  chatImageUpload: create_chatImageUpload(baseUrl, options),
  chatAudioUpload: create_chatAudioUpload(baseUrl, options),
  turnCredential: create_turnCredential(baseUrl, options),
  };
}
