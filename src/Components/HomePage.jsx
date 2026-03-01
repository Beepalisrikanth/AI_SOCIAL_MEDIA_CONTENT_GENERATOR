import React from 'react'
import { useState } from 'react';
import "./HomePage.css"
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const apiUrl = import.meta.env.VITE_API_URL;

console.log(apiKey, apiUrl)


const HomePage = () => {
    const [formData, setFormData] = useState({
        rawText: "",
        platforms: []
    })

    const [formattedPosts, setFormattedPosts] = useState([]);

    async function contactGemini() {
        try {
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("X-goog-api-key", apiKey);

            const raw = JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: `
                                    Generate social media posts based on this raw text:
                                    "${formData.rawText}"

                                    Platforms:
                                    ${formData.platforms.join(", ")}

                                    STRICT RULES:
                                    - Do NOT add any extra explanation.
                                    - Do NOT say "Here are your posts".
                                    - Follow EXACT format below.
                                    - Separate each platform with one blank line.
                                    - dont show any other platform names expect linkedin,instagram,twitter

                                    FORMAT:

                                    platform name : [PlatformName]
                                    post: [PostContent] `

                            }
                        ]
                    }
                ]
            });

            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: raw,
                redirect: "follow"
            };

            fetch(apiUrl, requestOptions)
                .then((response) => {
                    if (!response.ok) {
                        // If status is 429, display quota message
                        if (response.status === 429) {
                            setFormattedPosts("Error 429: Quota exceeded! Please wait for the daily reset at 5:30 AM IST.");
                        } else {
                            setFormattedPosts("Error " + response.status + ": " + response.statusText);
                        }
                        // Stop further processing
                        throw new Error("HTTP Error " + response.status);
                    }
                    return response.json();
                })
                .then((result) => {
                    if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
                        const rawText = result.candidates[0].content.parts[0].text.trim();
                        setFormattedPosts(parsePosts(rawText));
                    } else {
                        setFormattedPosts([{ platform: 'unknown', post: 'No posts generated.' }]);
                    }
                })
                .catch((error) => {
                    console.error(error)
                    if (!formattedPosts) {
                        setFormattedPosts("Network or other error: " + error.message);
                    }

                });




        } catch (e) {
            console.log(e)
        }

    }

    function parsePosts(raw) {
        if (!raw || typeof raw !== 'string') return [];
        const normalized = raw.replace(/\r/g, '\n');
        const results = [];

        // Try to match patterns like: linkedin : [PlatformName]\npost: [PostContent]
        const re = /(linkedin|instagram|twitter)\s*[:\-]?\s*\[?([^\]\n]+)\]?\s*(?:post\s*[:\-]?\s*([\s\S]*?))(?=(?:\n(?:linkedin|instagram|twitter)\s*[:\-]?)|$)/gim;
        let m;
        while ((m = re.exec(normalized)) !== null) {
            results.push({ platform: m[1].toLowerCase(), name: m[2].trim(), post: (m[3] || '').trim() });
        }

        if (results.length) return results;

        // Fallback: split by blank lines and attempt to extract platform/post pairs
        const sections = normalized.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
        for (const sec of sections) {
            const p = sec.match(/(linkedin|instagram|twitter)/i);
            const postMatch = sec.match(/post\s*[:\-]?\s*([\s\S]+)/i);
            if (p) {
                results.push({ platform: p[0].toLowerCase(), post: postMatch ? postMatch[1].trim() : sec });
            }
        }

        if (results.length) return results;

        return [{ platform: 'unknown', post: raw.trim() }];
    }

    return (
        <div className='SMCG'>
            <h1 className='heading1'>Social Media content Genertor</h1>

            <form className='formsection'>

                <h6 className='heading2'>Enter Description </h6>

                <textarea className='inputsection' name="rawText" id="rawText" placeholder='Write the content you want to post on social media'
                    onChange={(e) => {
                        setFormData({
                            ...formData,
                            rawText: e.target.value

                        })
                    }}
                    value={formData.rawText}>
                </textarea>

                <div className='platformBlock'>
                    <h6 className='heading2'>Platform</h6>
                    <div className='platformselections'>
                        <div className='platformselection'>
                            <input type="checkbox" name="platform" id="Linkedin" value={"linkedin"}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setFormData({
                                            ...formData,
                                            platforms: [...formData.platforms, e.target.value]
                                        })
                                    }
                                    else {
                                        setFormData({
                                            ...formData,
                                            platforms: formData.platforms.filter((platform) => platform !== e.target.value)
                                        })
                                    }
                                }}></input>
                            <span className='inputBtnPlatfrom'>Linkedin</span>
                        </div>

                        <div className='platformselection'>
                            <input type="checkbox" name="platform" id="Instagram" value={"Instagram"}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setFormData({
                                            ...formData,
                                            platforms: [...formData.platforms, e.target.value]
                                        })
                                    }
                                    else {
                                        setFormData({
                                            ...formData,
                                            platforms: formData.platforms.filter((platform) => platform !== e.target.value)
                                        })
                                    }
                                }}>
                            </input>
                            <span className='inputBtnPlatfrom'>Instagram</span>
                        </div>

                        <div className='platformselection'>
                            <input type="checkbox" name="platform" id="Twitter" value={"Twitter"}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setFormData({
                                            ...formData,
                                            platforms: [...formData.platforms, e.target.value]
                                        })
                                    }
                                    else {
                                        setFormData({
                                            ...formData,
                                            platforms: formData.platforms.filter((platform) => platform !== e.target.value)
                                        })
                                    }
                                }}></input>
                            <span className='inputBtnPlatfrom'>Twitter</span>
                        </div>
                    </div>
                </div>


                <button className='contactButton' type='button' onClick={() => { contactGemini() }}>contact gemini</button>

                <div className='posted_data'>
                    {Array.isArray(formattedPosts) && formattedPosts.length > 0 ? (
                        formattedPosts.map((p, i) => (
                            <div key={i} className='post-block'>
                                <h3 className='post-platform'>{(p.platform || p.name || 'Platform').toString().replace(/\[|\]/g, '')}</h3>
                                <p className='post-content'>{p.post}</p>
                            </div>
                        ))
                    ) : (
                        <p className='post-content'>{formattedPosts || ''}</p>
                    )}
                </div>
            </form>

                    <div className='footer'>© 2026 Srikanth. All rights reserved.</div>
        </div>
    )
}

export default HomePage
