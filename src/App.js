import React, { useState, useCallback, useEffect } from 'react';

// --- Helper Functions ---

// Helper function to convert file to base64
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
});

// --- API Call Functions ---

// Generic function to call the Gemini API
const callGeminiAPI = async (payload, apiKey) => {
    if (!apiKey) {
        throw new Error("API Key is missing. Please enter your Google AI API Key in Settings.");
    }
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

    const result = await response.json();

    if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
        return result.candidates[0].content.parts[0].text;
    } else {
        console.error("Invalid API Response:", result);
        if (result.promptFeedback && result.promptFeedback.blockReason) {
             throw new Error(`Request was blocked. Reason: ${result.promptFeedback.blockReason}. ${result.promptFeedback.blockReasonMessage || ''}`);
        }
        throw new Error("Invalid response structure from the API.");
    }
};


// --- UI Components ---

const EmailModal = ({ title, content, onClose, onCopy }) => {
    if (!content) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all text-gray-800 dark:text-gray-200">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">{title}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <div className="prose max-w-none bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg text-gray-700 dark:text-gray-300 whitespace-pre-wrap border border-gray-200 dark:border-gray-700" style={{ minHeight: '200px' }}>
                        {content}
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 rounded-b-xl flex justify-end space-x-3">
                    <button onClick={onCopy} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                        Copy to Clipboard
                    </button>
                    <button onClick={onClose} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const SettingsModal = ({ isOpen, onClose, apiKey, onApiKeyChange, theme, onThemeChange }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all text-gray-800 dark:text-gray-200">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">Settings</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Google AI API Key
                            </label>
                            <input
                                type="password"
                                id="api-key-input"
                                value={apiKey}
                                onChange={onApiKeyChange}
                                placeholder="Paste your API key here"
                                className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                Get a free key from <a href="https://aistudio.google.com/API" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>.
                            </p>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</span>
                            <button onClick={onThemeChange} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}/>
                            </button>
                        </div>
                    </div>
                </div>
                 <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 rounded-b-xl flex justify-end">
                    <button onClick={onClose} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Main App Component ---

const App = () => {
    const [invoiceData, setInvoiceData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState(null);
    const [fileName, setFileName] = useState('');
    const [modalContent, setModalContent] = useState(null);
    const [modalTitle, setModalTitle] = useState('');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('geminiApiKey') || '');
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleApiKeyChange = (e) => {
        const newKey = e.target.value;
        setApiKey(newKey);
        localStorage.setItem('geminiApiKey', newKey);
    };

    const handleThemeChange = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    // Function to handle invoice transcription
    const transcribeInvoice = async (file) => {
        if (!file) {
            setError("Please select a file first.");
            return;
        }
        if (!apiKey) {
            setError("Please enter your Google AI API Key in Settings to proceed.");
            setIsSettingsOpen(true);
            return;
        }

        setIsLoading(true);
        setLoadingMessage(`Analyzing invoice: ${file.name}...`);
        setError(null);
        setInvoiceData(null);
        setFileName(file.name);

        try {
            const base64ImageData = await toBase64(file);
            const prompt = `Analyze the following invoice/bill image. Extract the information in the specified JSON format. Identify the currency symbol (e.g., $, €, £) and include it. Ensure all monetary values are numbers.`;
            const payload = {
                contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: file.type, data: base64ImageData } }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            "invoiceNumber": { "type": "STRING" }, "invoiceDate": { "type": "STRING" }, "dueDate": { "type": "STRING" },
                            "billedTo": { "type": "STRING" }, "from": { "type": "STRING" }, "currency": { "type": "STRING" },
                            "lineItems": {
                                "type": "ARRAY",
                                "items": {
                                    "type": "OBJECT",
                                    "properties": {
                                        "description": { "type": "STRING" }, "quantity": { "type": "NUMBER" },
                                        "unitPrice": { "type": "NUMBER" }, "total": { "type": "NUMBER" }
                                    },
                                    "required": ["description", "quantity", "unitPrice", "total"]
                                }
                            },
                            "subtotal": { "type": "NUMBER" }, "tax": { "type": "NUMBER" }, "total": { "type": "NUMBER" }
                        },
                        required: ["invoiceNumber", "invoiceDate", "billedTo", "from", "lineItems", "subtotal", "total", "currency"]
                    }
                }
            };
            
            const jsonText = await callGeminiAPI(payload, apiKey);
            const parsedJson = JSON.parse(jsonText);
            parsedJson.lineItems = parsedJson.lineItems.map(item => ({ ...item, category: '' }));
            setInvoiceData(parsedJson);

        } catch (err) {
            console.error("Error during transcription:", err);
            setError(`Failed to transcribe invoice. ${err.message}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    // Function to get category suggestions
    const getCategorySuggestion = async (itemDescription, index) => {
        setIsLoading(true);
        setLoadingMessage(`✨ Getting category for "${itemDescription}"...`);
        setError(null);
        try {
            const prompt = `Based on the item description "${itemDescription}", suggest a single, common business expense category (e.g., "Software", "Office Supplies", "Marketing", "Travel", "Meals & Entertainment"). Respond with only the category name.`;
            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
            const category = await callGeminiAPI(payload, apiKey);
            
            setInvoiceData(prevData => {
                const newLineItems = [...prevData.lineItems];
                newLineItems[index].category = category.trim();
                return { ...prevData, lineItems: newLineItems };
            });
        } catch (err) {
            console.error("Error getting category:", err);
            setError(`Failed to get category suggestion. ${err.message}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    // Function to get categories for all items
    const getAllCategorySuggestions = async () => {
        if (!invoiceData || !invoiceData.lineItems) return;
        
        setIsLoading(true);
        setLoadingMessage('✨ Getting all category suggestions...');
        setError(null);
        try {
            const descriptions = invoiceData.lineItems.map(item => item.description);
            const prompt = `For each item description in this list, suggest a single, common business expense category. Descriptions: ${JSON.stringify(descriptions)}. Respond with a JSON object where keys are the original descriptions and values are the suggested categories.`;
            const payload = {
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            };

            const responseText = await callGeminiAPI(payload, apiKey);
            const categories = JSON.parse(responseText);

            setInvoiceData(prevData => {
                const newLineItems = prevData.lineItems.map(item => ({
                    ...item,
                    category: categories[item.description] || item.category || ''
                }));
                return { ...prevData, lineItems: newLineItems };
            });

        } catch (err) {
            console.error("Error getting all categories:", err);
            setError(`Failed to get all category suggestions. ${err.message}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    // Function to generate email drafts
    const generateEmail = async (emailType) => {
        if (!invoiceData) return;

        setIsLoading(true);
        setLoadingMessage(`✨ Drafting ${emailType} email...`);
        setError(null);
        try {
            const currencySymbol = invoiceData.currency || '$';
            let prompt;
            if (emailType === 'Payment Approval') {
                setModalTitle('Draft: Payment Approval Request');
                prompt = `Write a polite and professional email to an internal accounting department to request payment approval for the following invoice. Keep it concise.
                Invoice Details:
                - From: ${invoiceData.from}
                - Invoice Number: ${invoiceData.invoiceNumber}
                - Total Amount: ${currencySymbol}${invoiceData.total.toFixed(2)}
                - Due Date: ${invoiceData.dueDate}
                Sign off as "Best regards,".`;
            } else if (emailType === 'Vendor Query') {
                 setModalTitle('Draft: Query to Vendor');
                 prompt = `Write a polite and professional email to a vendor (${invoiceData.from}) to ask for clarification on their invoice. Mention the invoice number (${invoiceData.invoiceNumber}) and total amount (${currencySymbol}${invoiceData.total.toFixed(2)}). Include a placeholder like "[INSERT QUESTION ABOUT A SPECIFIC CHARGE HERE]" for the user to fill in. Keep it concise.
                 Sign off as "Thank you,".`;
            }

            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
            const emailContent = await callGeminiAPI(payload, apiKey);
            setModalContent(emailContent);

        } catch (err) {
             console.error("Error generating email:", err);
             setError(`Failed to generate email. ${err.message}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleCategoryChange = (e, index) => {
        const { value } = e.target;
        setInvoiceData(prevData => {
            const newLineItems = [...prevData.lineItems];
            newLineItems[index].category = value;
            return { ...prevData, lineItems: newLineItems };
        });
    };
    
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) transcribeInvoice(file);
    };
    const handleDrop = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900/50');
        const file = event.dataTransfer.files[0];
        if (file) transcribeInvoice(file);
    }, [apiKey]);
    const handleDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation(); }, []);
    const handleDragEnter = useCallback((e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add('bg-blue-100', 'dark:bg-blue-900/50'); }, []);
    const handleDragLeave = useCallback((e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900/50'); }, []);

    const downloadCSV = () => {
        if (!invoiceData) return;
        const headers = ["Invoice no.", "Customer", "Invoice date", "Due date", "Item(Product/Service)", "Description", "Item quantity", "Item rate", "Item amount", "Tax amount", "Item Category", "Currency"];
        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
        invoiceData.lineItems.forEach((item, index) => {
            const row = [
                index === 0 ? invoiceData.invoiceNumber || '' : '',
                index === 0 ? `"${(invoiceData.billedTo || '').replace(/"/g, '""')}"` : '',
                index === 0 ? invoiceData.invoiceDate || '' : '',
                index === 0 ? invoiceData.dueDate || '' : '',
                `"${(item.description || '').replace(/"/g, '""')}"`,
                `"${(item.description || '').replace(/"/g, '""')}"`,
                item.quantity || 0,
                item.unitPrice || 0,
                item.total || 0,
                index === 0 ? invoiceData.tax || 0 : '',
                item.category || '',
                index === 0 ? invoiceData.currency || '' : ''
            ].join(",");
            csvContent += row + "\n";
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `invoice_${invoiceData.invoiceNumber || 'data'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const copyToClipboard = (text) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try { document.execCommand('copy'); } catch (err) { console.error('Failed to copy text: ', err); }
        document.body.removeChild(textArea);
    };

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return 'N/A';
        const currencySymbol = invoiceData.currency || '$';
        return `${currencySymbol}${amount.toFixed(2)}`;
    };

    return (
        <>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} apiKey={apiKey} onApiKeyChange={handleApiKeyChange} theme={theme} onThemeChange={handleThemeChange} />
            <EmailModal title={modalTitle} content={modalContent} onClose={() => setModalContent(null)} onCopy={() => copyToClipboard(modalContent)} />
            
            <div className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans text-gray-800 dark:text-gray-200 transition-colors duration-300">
                <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                    <header className="relative text-center mb-8">
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">AI Invoice Assistant</h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">Extract, categorize, and act on invoice data instantly.</p>
                        <button onClick={() => setIsSettingsOpen(true)} className="absolute top-0 right-0 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" title="Settings">
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                    </header>

                    <main>
                        {!invoiceData && (
                             <div className="w-full max-w-2xl mx-auto border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center transition-colors duration-300" onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}>
                                <input type="file" id="file-upload" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} disabled={isLoading || !apiKey} />
                                <label htmlFor="file-upload" className={!apiKey ? "cursor-not-allowed opacity-50" : "cursor-pointer"}>
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400"><span className="font-semibold text-blue-600 dark:text-blue-400">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">PNG, JPG, PDF, etc.</p>
                                     {!apiKey && <p className="text-red-500 text-xs mt-2 font-semibold">Please enter an API key in Settings to enable uploads.</p>}
                                </label>
                            </div>
                        )}

                        {isLoading && (
                            <div className="text-center mt-8 flex items-center justify-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                                <p className="ml-3 text-gray-600 dark:text-gray-400">{loadingMessage}</p>
                            </div>
                        )}

                        {error && (
                            <div className="mt-8 max-w-2xl mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative dark:bg-red-900/30 dark:border-red-600 dark:text-red-300" role="alert">
                                <strong className="font-bold">Error:</strong>
                                <span className="block sm:inline ml-2">{error}</span>
                            </div>
                        )}
                        
                        {invoiceData && (
                            <div className="mt-10 max-w-5xl mx-auto bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg animate-fade-in">
                                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Extracted Data</h2>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setInvoiceData(null)} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors">Upload New</button>
                                        <button onClick={downloadCSV} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-all duration-300">Download CSV</button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 text-sm">
                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg"><p className="font-semibold text-gray-500 dark:text-gray-400">Invoice #</p><p className="dark:text-white font-medium text-base">{invoiceData.invoiceNumber || 'N/A'}</p></div>
                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg"><p className="font-semibold text-gray-500 dark:text-gray-400">Invoice Date</p><p className="dark:text-white font-medium text-base">{invoiceData.invoiceDate || 'N/A'}</p></div>
                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg"><p className="font-semibold text-gray-500 dark:text-gray-400">Due Date</p><p className="dark:text-white font-medium text-base">{invoiceData.dueDate || 'N/A'}</p></div>
                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg sm:col-span-1"><p className="font-semibold text-gray-500 dark:text-gray-400">From</p><p className="dark:text-white font-medium text-base">{invoiceData.from || 'N/A'}</p></div>
                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg sm:col-span-2"><p className="font-semibold text-gray-500 dark:text-gray-400">Billed To</p><p className="dark:text-white font-medium text-base">{invoiceData.billedTo || 'N/A'}</p></div>
                                </div>
                                
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Line Items</h3>
                                    <button onClick={getAllCategorySuggestions} disabled={isLoading} className="bg-indigo-100 text-indigo-700 font-semibold py-2 px-4 rounded-lg hover:bg-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/30 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">✨ Suggest All Categories</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-100 dark:bg-gray-700/50 text-sm font-semibold text-gray-600 dark:text-gray-400">
                                                <th className="p-3 rounded-l-lg w-2/5">Description</th>
                                                <th className="p-3 w-2/5">Category</th>
                                                <th className="p-3 text-right">Qty</th>
                                                <th className="p-3 text-right">Price</th>
                                                <th className="p-3 text-right rounded-r-lg">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoiceData.lineItems && invoiceData.lineItems.map((item, index) => (
                                                <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                                                    <td className="p-3 font-medium dark:text-gray-200">{item.description || 'N/A'}</td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2">
                                                            <input type="text" value={item.category} onChange={(e) => handleCategoryChange(e, index)} className="w-full p-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md text-sm" placeholder="No category"/>
                                                            <button onClick={() => getCategorySuggestion(item.description, index)} disabled={isLoading} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 p-1 disabled:opacity-50" title="Suggest Category">✨</button>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-right">{item.quantity !== undefined ? item.quantity : 'N/A'}</td>
                                                    <td className="p-3 text-right">{formatCurrency(item.unitPrice)}</td>
                                                    <td className="p-3 text-right font-semibold">{formatCurrency(item.total)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-3">AI Actions</h3>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button onClick={() => generateEmail('Payment Approval')} disabled={isLoading} className="flex-1 text-center bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">📧 Draft Payment Approval</button>
                                            <button onClick={() => generateEmail('Vendor Query')} disabled={isLoading} className="flex-1 text-center bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50">📧 Draft Vendor Query</button>
                                        </div>
                                    </div>
                                    <div className="w-full max-w-xs text-sm ml-auto">
                                        <div className="flex justify-between py-2"><span className="text-gray-600 dark:text-gray-400">Subtotal</span><span className="font-semibold">{formatCurrency(invoiceData.subtotal)}</span></div>
                                        <div className="flex justify-between py-2"><span className="text-gray-600 dark:text-gray-400">Tax</span><span className="font-semibold">{formatCurrency(invoiceData.tax)}</span></div>
                                        <div className="flex justify-between py-3 border-t-2 border-gray-200 dark:border-gray-600 mt-2"><span className="font-bold text-base text-gray-900 dark:text-white">Total</span><span className="font-bold text-base text-gray-900 dark:text-white">{formatCurrency(invoiceData.total)}</span></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
};

export default App;
