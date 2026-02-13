async function getKey() {
  const result = await chrome.storage.local.get(['MY_API_KEY']);
  
  if (!result.MY_API_KEY) {
    console.warn("API Key is missing. Please set it in the options page.");
    return null;
  }
  
  return result.MY_API_KEY;
}

async function listMyModels() {
  const API_KEY = await getKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.error("❌ API Key Error:", data.error.message);
      return;
    }

    console.log("✅ Models found for your key:");
    data.models.forEach(m => {
      if (m.supportedGenerationMethods.includes("generateContent")) {
        console.log(`- ${m.name.split('/').pop()} (${m.displayName})`);
      }
    });
  } catch (e) {
    console.error("❌ Network Error while listing models:", e);
  }
}
//listMyModels();

async function testSummarization() {
  const prompt = "Please list key points from the youtube video";
  const utube_url = "https://www.youtube.com/watch?v=vSNZGWfitjM";
  const API_KEY = await getKey();
  const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: `${prompt}: ${utube_url}` }] }] })
    });
    const data = await response.json();
    if (data.error)
      console.error("API Error: ", data.error.message);
    else
      console.log(`>> Summary from Gemini for ${utube_url}: ${data.candidates[0].content.parts[0].text}`);
  } catch (error) {
    console.error("Gemini Error:", error);
  }
}
//testSummarization();

// Context Menu (Right-click)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ListKeyPoints",
    title: "List Key Points From",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "ListKeyPointsVideo",
    title: "List Key Points from YouTube Video",
    contexts: ["video", "link"],
    documentUrlPatterns: ["*://*.youtube.com/*"] // Only shows on YouTube
  });
  chrome.contextMenus.create({
    id: "ExploreOnCanvas",
    title: "Explore on Canvas",
    contexts: ["selection"]
  });
});

// Toolbar Icon Click (Pinned Extension)
chrome.action.onClicked.addListener(async (tab) => {
  const API_KEY = await getKey();
  const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
  if (!tab.id) return;
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: runSummarization,
    args: ["List Key Points From", null, API_KEY, API_URL] // Pass null to grab the whole page
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const API_KEY = await getKey();
  const MODEL_ID = "gemini-2.5-flash"; // gemini-2.5-flash, gemini-3-pro-preview, gemini-2.5-pro, gemini-2.5-flash-latest
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`;

  if (info.menuItemId === "ListKeyPoints") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: runWonderizer,
      args: ["List Key Points From", info.selectionText, API_KEY, API_URL] 
    });
  }

  if (info.menuItemId === "ListKeyPointsVideo") {
    const targetUrl = info.linkUrl || info.pageUrl || tab.url;
    console.log(">> Target Url:", targetUrl);
    const response = await fetch("http://localhost:3000/get-transcript", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl: targetUrl })
    });

    if (!response.ok) {
      const data = await response.json();
      console.error(data.error);
      return;
    }

    const data = await response.json();
    const transcriptText = data.text || "Error: No transcript content received from server.";
    console.log("Transcript extracted:", transcriptText.substring(0, 100));

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: runSummarization,
      args: ["List key points From", transcriptText, API_KEY, API_URL]
    });
  }

  if (info.menuItemId === "ExploreOnCanvas") {
    const sessionId = crypto.randomUUID();
    const session = {
      sessionId,
      sourceText: info.selectionText,
      coreQuestion: "What are the key ideas here?",
      pathSuggestions: [
        "Clarify",
        "Go Deeper",
        "Challenge",
        "Apply",
        "Connect",
        "Surprise Me"
      ],
      demoMode: true,
      createdAt: Date.now()
    };

    await chrome.storage.local.set({ [`session_${sessionId}`]: session });
    // TODO: Session TTL cleanup — consider expiring sessions older than 7 days
    console.log("Explore on Canvas: session created", sessionId);

    // TODO: E2-3 will add chrome.tabs.create here to open canvas.html
  }
});

async function runSummarization(prompt, passedText, key, url) {
  const selectedText = passedText || document.body.innerText;
  // IMPROVED PARSER: Handles Bold, Italic, and Bullet Lists properly
  function parseMarkdown(text) {
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>')             // Italic
      .replace(/^### (.*$)/gim, '<h4 style="border-bottom: 1px solid #a2a9b1; margin-top:1em;">$1</h4>')
      .replace(/^## (.*$)/gim, '<h3 style="border-bottom: 1px solid #a2a9b1; margin-top:1.2em;">$1</h3>');

    // Handle Lists: Wraps lines starting with * or - into <li> tags
    const lines = html.split('\n');
    let inList = false;
    html = lines.map(line => {
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const item = line.trim().substring(2);
        const prefix = inList ? '' : '<ul style="padding-left: 20px; margin-top: 5px;">';
        inList = true;
        return `${prefix}<li>${item}</li>`;
      } else if (inList) {
        inList = false;
        return '</ul>' + line;
      }
      return line + '<br>';
    }).join('');
    
    return inList ? html + '</ul>' : html;
  }

  // CREATE WIKI-STYLE OVERLAY
  const overlay = document.createElement('div');
  overlay.id = "gemini-wiki-widget";
  overlay.style.cssText = `
    position: fixed; top: 2vh; left: 50%; transform: translateX(-50%);
    width: 400px; height: 500px; min-width: 250px; min-height: 200px; max-height: 90vh;
    background: #f8f9fa; color: #202122; 
    z-index: 2147483647; border: 1px solid #a2a9b1; 
    border-radius: 2px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
    font-family: 'Linux Libertine','Georgia','Times',serif; 
    display: flex; flex-direction: column;
    resize: both; overflow: hidden;
  `;

  overlay.innerHTML = `
    <div style="background: #eaecf0; padding: 10px 15px; border-bottom: 1px solid #a2a9b1; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 1.2em; font-weight: bold; color: #000;">Gemini Intelligence</span>
      <button id="close-wiki" style="border:none; background:none; cursor:pointer; font-size: 20px; color: #72777d;">×</button>
    </div>
    <div id="wiki-body" style="padding: 20px; overflow-y: auto; font-size: 14px; line-height: 1.6;">
      <p style="font-style: italic; color: #72777d;">Consulting Gemini 2.5 Flash...</p>
    </div>
    <div style="padding: 10px 15px; border-top: 1px solid #eaecf0; text-align: right; background: #fff;">
      <a href="https://aistudio.google.com/" target="_blank" style="color: #3366cc; font-size: 11px; text-decoration: none;">Powered by Google AI</a>
    </div>
  `;

  document.body.appendChild(overlay);
  document.getElementById('close-wiki').onclick = () => overlay.remove();

  try {
    const response = await fetch(`${url}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${prompt}:\n\n${selectedText}` }] }]  // PROMPT SENT to GEMINI
      })
    });

    const data = await response.json();

    // 1. Check for API-level errors (like invalid keys or quota)
    if (data.error) {
      throw new Error(`API Error (${data.error.code}): ${data.error.message}`);
    }

    // 2. Check for Safety Filters or empty responses
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("Gemini declined to answer. This is usually due to safety filters or a complex prompt.");
    }

    const candidate = data.candidates[0];

    // 3. Check if the response was blocked mid-generation
    if (candidate.finishReason === "SAFETY") {
      throw new Error("Response blocked: Gemini flagged the content as potentially sensitive.");
    }

    if (!candidate.content || !candidate.content.parts) {
      throw new Error("Incomplete response: The model returned a blank result.");
    }

    const rawText = candidate.content.parts[0].text;
    document.getElementById('wiki-body').innerHTML = parseMarkdown(rawText);

  } catch (err) {
    document.getElementById('wiki-body').innerHTML = `
      <div style="color: #d33; font-weight: bold;">⚠️ Extraction/API Error</div>
      <p style="color: #555; font-size: 13px; margin-top: 10px;">${err.message}</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;">
      <small style="color: #999;">Check your API key in the options page and ensure your local Python server is running.</small>
    `;
  }
}

async function runWonderizer(prompt, passedText, key, url) {
  const selectedText = passedText || document.body.innerText;

  function createWonderwheel(items) {
    if (items.length === 0) return "";
    
    // We limit to 8 items to keep the circle from getting too crowded
    const displayItems = items.slice(0, 8);
    const angleStep = 360 / displayItems.length;

    const listItems = displayItems.map((item, i) => {
      const angle = i * angleStep;
      // Calculate position on a circle with radius 110px
      return `
        <div class="ww-node" style="transform: rotate(${angle}deg) translate(110px) rotate(-${angle}deg);">
          <div class="ww-content" title="${item}">${item}</div>
        </div>`;
    }).join('');

    return `
      <div class="wonderwheel-container">
        <div class="ww-center">Key Points</div>
        ${listItems}
      </div>
    `;
  }

  function parseToWonderwheel(text) {
    // Extract lines starting with * or - 
    const lines = text.split('\n');
    const bulletPoints = lines
      .filter(line => line.trim().startsWith('* ') || line.trim().startsWith('- '))
      .map(line => line.trim().substring(2));

    if (bulletPoints.length > 0) {
      return createWonderwheel(bulletPoints);
    }
    
    // Fallback if no bullets found
    return `<p>${text}</p>`;
  }

  // CREATE WIKI-STYLE OVERLAY WITH WONDERWHEEL STYLES
  const overlay = document.createElement('div');
  overlay.id = "gemini-wiki-widget";
  
  // Injecting CSS for the Wonderwheel
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    .wonderwheel-container {
      position: relative;
      width: 300px;
      height: 300px;
      margin: 40px auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ww-center {
      width: 80px;
      height: 80px;
      background: #3366cc;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      text-align: center;
      z-index: 10;
      box-shadow: 0 4px 10px rgba(51,102,204,0.3);
      font-size: 12px;
    }
    .ww-node {
      position: absolute;
      width: 100px;
      transition: all 0.3s ease;
    }
    .ww-content {
      background: white;
      border: 1px solid #a2a9b1;
      padding: 8px;
      border-radius: 8px;
      font-size: 11px;
      line-height: 1.2;
      max-height: 60px;
      overflow: hidden;
      text-overflow: ellipsis;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      cursor: help;
    }
    .ww-content:hover {
      transform: scale(1.1);
      z-index: 20;
      max-height: none;
      background: #f8f9fa;
    }
  `;
  document.head.appendChild(styleTag);

  overlay.style.cssText = `
    position: fixed; top: 2vh; left: 50%; transform: translateX(-50%);
    width: 450px; height: 550px; background: #f8f9fa; color: #202122; 
    z-index: 2147483647; border: 1px solid #a2a9b1; 
    border-radius: 4px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); 
    font-family: sans-serif; display: flex; flex-direction: column;
    overflow: hidden;
  `;

  overlay.innerHTML = `
    <div style="background: #eaecf0; padding: 10px 15px; border-bottom: 1px solid #a2a9b1; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-weight: bold;">Gemini Wonderwheel</span>
      <button id="close-wiki" style="border:none; background:none; cursor:pointer; font-size: 20px;">×</button>
    </div>
    <div id="wiki-body" style="flex-grow: 1; overflow-y: auto; padding: 10px;">
      <p style="text-align:center; margin-top: 50px;">Generating visualization...</p>
    </div>
  `;

  document.body.appendChild(overlay);
  document.getElementById('close-wiki').onclick = () => overlay.remove();

  try {
    const response = await fetch(`${url}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Summarize the following into exactly 6-8 concise bullet points:\n\n${selectedText}` }] }]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const rawText = data.candidates[0].content.parts[0].text;
    document.getElementById('wiki-body').innerHTML = parseToWonderwheel(rawText);

  } catch (err) {
    document.getElementById('wiki-body').innerHTML = `<div style="color:red; padding: 20px;">${err.message}</div>`;
  }
}