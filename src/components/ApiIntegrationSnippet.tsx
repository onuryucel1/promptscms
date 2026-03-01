'use client';

import { useState } from 'react';
import { Code, Terminal, Copy, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface ApiIntegrationSnippetProps {
    promptId: string;
    content: string;
}

export default function ApiIntegrationSnippet({ promptId, content }: ApiIntegrationSnippetProps) {
    const { showToast } = useToast();
    const [isExpanded, setIsExpanded] = useState(false);
    const [copiedContent, setCopiedContent] = useState<'curl' | 'js' | 'python' | null>(null);
    const [activeTab, setActiveTab] = useState<'curl' | 'js' | 'python'>('curl');

    const getVariables = (text: string) => {
        return Array.from(new Set(Array.from(text.matchAll(/{{([^}]+)}}/g)).map(m => m[1].trim())));
    };

    const vars = getVariables(content);

    // Generate JSON string for variables
    const varsObj = vars.reduce((acc, v) => ({ ...acc, [v]: `[${v}_değeri]` }), {});
    const varsJsonString = Object.keys(varsObj).length > 0
        ? JSON.stringify({ variables: varsObj }, null, 2)
        : JSON.stringify({}, null, 2);

    const bashCurl = `curl -X POST http://localhost:3000/api/v1/run/${promptId} \\
  -H "Authorization: Bearer SIZIN_API_KEY_NIZ" \\
  -H "Content-Type: application/json" \\
  -d '${varsJsonString}'`;

    const jsCode = `const response = await fetch('http://localhost:3000/api/v1/run/${promptId}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer SIZIN_API_KEY_NIZ',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(${varsJsonString})
});

const data = await response.json();
console.log(data.result);`;

    const pythonCode = `import requests
import json

url = "http://localhost:3000/api/v1/run/${promptId}"
headers = {
    "Authorization": "Bearer SIZIN_API_KEY_NIZ",
    "Content-Type": "application/json"
}
data = ${varsJsonString.replace(/null/g, 'None')}

response = requests.post(url, headers=headers, json=data)
print(response.json()["result"])`;

    const snippets = {
        curl: bashCurl,
        js: jsCode,
        python: pythonCode
    };

    const handleCopy = (type: 'curl' | 'js' | 'python') => {
        navigator.clipboard.writeText(snippets[type]);
        setCopiedContent(type);
        showToast('Kod panoya kopyalandı!', 'success');
        setTimeout(() => setCopiedContent(null), 2000);
    };

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col mt-6 overflow-hidden">
            <div
                className="p-4 border-b border-zinc-100 bg-gradient-to-r from-slate-50 to-blue-50/30 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                        <Terminal size={18} />
                    </div>
                    <div>
                        <h2 className="font-semibold text-zinc-900">API Entegrasyon Rehberi</h2>
                        <p className="text-[10px] text-zinc-500">Bu promptu projenizde kod ile tetiklemek için gereken örnekler (API Deployment).</p>
                    </div>
                </div>
                <div className="text-zinc-400">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>

            {isExpanded && (
                <div className="p-0 flex flex-col">
                    <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-3 flex gap-2 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('curl')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${activeTab === 'curl' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-600 hover:bg-zinc-200'}`}
                        >
                            <Terminal size={14} /> cURL (Bash)
                        </button>
                        <button
                            onClick={() => setActiveTab('js')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${activeTab === 'js' ? 'bg-amber-400 text-amber-950 shadow-sm' : 'text-zinc-600 hover:bg-zinc-200'}`}
                        >
                            <Code size={14} /> JavaScript / Node.js
                        </button>
                        <button
                            onClick={() => setActiveTab('python')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${activeTab === 'python' ? 'bg-blue-500 text-white shadow-sm' : 'text-zinc-600 hover:bg-zinc-200'}`}
                        >
                            <Code size={14} /> Python (Requests)
                        </button>
                    </div>

                    <div className="relative bg-slate-900 m-4 rounded-xl overflow-hidden border border-slate-700 shadow-inner">
                        <div className="absolute right-2 top-2">
                            <button
                                onClick={() => handleCopy(activeTab)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-600"
                                title="Kodu Kopyala"
                            >
                                {copiedContent === activeTab ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                            </button>
                        </div>
                        <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                            {snippets[activeTab]}
                        </pre>
                    </div>

                    <div className="px-5 pb-5 pt-1 text-xs text-zinc-500 leading-relaxed">
                        <strong className="text-zinc-700">Not:</strong> İstekte bulunmadan önce Ayarlar sayfasından bir <strong>API Key</strong> oluşturmayı unutmayın. Bu istek otomatik olarak bu promptun <span className="bg-emerald-50 text-emerald-700 font-semibold px-1 py-0.5 rounded">PROD</span> etiketli canlı versiyonunu (eğer yoksa, mevcut en son kayıtlı taslağı) tetikler. Değişkenleri (variables) JSON formatında gövdede (body) gönderebilirsiniz.
                    </div>
                </div>
            )}
        </div>
    );
}
