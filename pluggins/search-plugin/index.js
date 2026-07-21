export default {
  id: 'search-plugin',
  name: 'Recherche Web (DuckDuckGo)',
  description: 'Permet à l\'IA de faire des recherches web.',
  tools: [
    {
      type: 'function',
      function: {
        name: 'GoogleSearch',
        description: 'Query DuckDuckGo html search endpoint and parse results',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query string'
            }
          },
          required: ['query']
        }
      }
    }
  ],
  async executeTool(name, args, chatId) {
    if (name === 'GoogleSearch') {
      const query = args.query;
      if (!query || typeof query !== 'string') {
        return 'error: query parameter is missing or not a string';
      }
      try {
        const searchURL = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query);
        const resp = await fetch(searchURL, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        if (!resp.ok) {
          return `error: search request failed with status code ${resp.status}`;
        }
        const html = await resp.text();
        const alternativeBlocks = html.split('<div class="result results_links');
        if (alternativeBlocks.length <= 1) {
          return '[]';
        }

        function cleanHTML(input) {
          let res = input.replace(/<[^>]*>/g, '');
          res = res
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#x27;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#39;/g, "'");
          return res.trim();
        }

        const results = [];
        const titleRe = /class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/;
        const snippetRe = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/;

        for (const block of alternativeBlocks.slice(1)) {
          const titleMatch = titleRe.exec(block);
          if (!titleMatch) continue;
          const resURL = titleMatch[1];
          const title = cleanHTML(titleMatch[2]);

          let snippet = '';
          const snippetMatch = snippetRe.exec(block);
          if (snippetMatch) {
            snippet = cleanHTML(snippetMatch[1]);
          }

          results.push({
            title,
            url: resURL,
            snippet
          });
        }
        return JSON.stringify(results);
      } catch (err) {
        return `error performing search request: ${err.message}`;
      }
    }
    return null;
  }
};
