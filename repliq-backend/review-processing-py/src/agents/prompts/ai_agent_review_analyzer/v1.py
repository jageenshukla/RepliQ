"""
Prompt for AI Agent Review Analyzer (Version 1)
"""

PROMPT = """
Analyze reviews for sentiment, issues, and new requests. Identify the following:
1. **Sentiment**: Determine the sentiment of the review (Positive, Negative, Neutral).
2. **Issues**: Extract problems or complaints reported by the user. For each issue, provide:
   - **Title**: A one-line description of the issue.
   - **Description**: A detailed explanation of the issue in simple terms, suitable for creating a JIRA ticket.
   - **Tags**: Relevant tags representing screens (e.g., HOME, SEARCH, PLAYER) or features (e.g., DOWNLOAD_SONG, PLAY_SONG). Tags must be in uppercase and use underscores (_) for spaces to ensure compatibility with JIRA.
3. **New Requests**: Extract features or improvements requested by the user. For each request, provide:
   - **Title**: A one-line description of the request.
   - **Description**: A detailed explanation of the request and any suggested solutions.
   - **Tags**: Relevant tags representing screens or features. Tags must follow the same format as issues (uppercase with underscores for spaces).

**Note**: All analysis, including sentiment, issues, and new requests, must be provided in English, even if the review is in a different language.

Provide the output in the following JSON format:
{
  "sentiment": "sentiment of user review (positive, negative, neutral)",
  "issues": [
    {
      "title": "one line description of issue user mentioned in review",
      "description": "Detail explanation what user mention in review in simple ways. We need to understand what user complain in simple words so that we can pass this message across team and create JIRA ticket",
      "tags": [
        "Any tags which you can find out which represent SCREEN like HOME, SEARCH, MYPAGE, PLAYER etc OR FEATURE like DOWNLOAD_SONG, FAVORITE_SONG, PLAY_SONG, CREATE_PLAYLIST"
      ]
    }
  ],
  "new_requests": [
    {
      "title": "one line description of new request user mentioned in review",
      "description": "Detail explanation what user mention in review in simple ways. We need to understand what user request about and if any possible solution user want us to follow",
      "tags": [
        "Any tags which you can find out which represent SCREEN like HOME, SEARCH, MYPAGE, PLAYER etc OR FEATURE like DOWNLOAD_SONG, FAVORITE_SONG, PLAY_SONG, CREATE_PLAYLIST"
      ]
    }
  ]
}

Examples:
[1]
User: "The app crashes when I try to play a song from my playlist. Also, it would be great if I could sort my playlists alphabetically."
Assistant: {
  "sentiment": "Negative",
  "issues": [
    {
      "title": "App crashes when playing a song from playlist",
      "description": "The user reported that the app crashes whenever they attempt to play a song from their playlist. This is a critical issue that needs immediate attention.",
      "tags": ["PLAYER", "PLAY_SONG"]
    }
  ],
  "new_requests": [
    {
      "title": "Add option to sort playlists alphabetically",
      "description": "The user requested a feature to sort their playlists alphabetically, which would improve usability and organization.",
      "tags": ["MYPAGE", "CREATE_PLAYLIST"]
    }
  ]
}

[2]
User: "I love the app, but it would be nice if the search results could show more relevant songs."
Assistant: {
  "sentiment": "Positive",
  "issues": [],
  "new_requests": [
    {
      "title": "Improve relevance of search results",
      "description": "The user suggested enhancing the search functionality to display more relevant songs in the results.",
      "tags": ["SEARCH"]
    }
  ]
}
"""
