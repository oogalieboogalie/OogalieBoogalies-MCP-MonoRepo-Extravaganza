# MiniMax MCP Server

The MiniMax MCP server provides powerful multimodal generation capabilities, including text-to-image, text-to-audio/speech, voice cloning, video generation, and music generation.

## Features

- **Image Generation**: Create images from text prompts with multiple aspect ratios, prompt optimization, and batch generation.
- **Audio/Speech Synthesis**: Generate audio from text with multiple voices and languages, voice cloning, and emotion control.
- **Video Generation**: Create videos from text or images with duration and resolution control.
- **Music Generation**: Generate music from lyrics and prompts with multiple formats and bitrate control.

## Setup

1.  **No Installation Needed**: The server is run directly using `npx`.

2.  **API Key**:
    - Obtain an API key from the MiniMax platform.
    - Set the `MINIMAX_API_KEY` environment variable in your MCP client.

3.  **Base Path**:
    - Set the `MINIMAX_MCP_BASE_PATH` environment variable to specify the output directory for generated files.

## Example Usage

### Text-to-Image

```json
{
  "tool": "text_to_image",
  "parameters": {
    "prompt": "a futuristic web interface",
    "aspectRatio": "16:9"
  }
}
```

### Text-to-Audio

```json
{
  "tool": "text_to_audio",
  "parameters": {
    "text": "Welcome to the future of web design",
    "voiceId": "male-qn-qingse"
  }
}
```

### Generate Video

```json
{
  "tool": "generate_video",
  "parameters": {
    "prompt": "a beautiful sunset"
  }
}
```

### Music Generation

```json
{
  "tool": "music_generation",
  "parameters": {
    "prompt": "a happy upbeat song",
    "lyrics": "..."
  }
}
```
