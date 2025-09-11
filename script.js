document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const textInput = document.getElementById('text-input');
    const languageSelect = document.getElementById('language-select');
    const genderSelect = document.getElementById('gender-select');
    const voiceSelect = document.getElementById('voice-select');
    const rateInput = document.getElementById('rate');
    const rateValue = document.getElementById('rate-value');
    const pitchInput = document.getElementById('pitch');
    const pitchValue = document.getElementById('pitch-value');
    const volumeInput = document.getElementById('volume');
    const volumeValue = document.getElementById('volume-value');
    const btnPlay = document.getElementById('btn-play');
    const btnPause = document.getElementById('btn-pause');
    const btnStop = document.getElementById('btn-stop');
    const status = document.getElementById('status');
    const browserSupport = document.getElementById('browser-support');

    // 初始化语音合成
    const synth = window.speechSynthesis;
    let utterance = null;
    let voices = [];

    // 检查浏览器支持
    if (!synth) {
        status.textContent = '您的浏览器不支持语音合成功能';
        status.className = 'status paused';
        browserSupport.classList.remove('hidden');
        // 禁用所有控件
        textInput.disabled = true;
        languageSelect.disabled = true;
        genderSelect.disabled = true;
        voiceSelect.disabled = true;
        rateInput.disabled = true;
        pitchInput.disabled = true;
        volumeInput.disabled = true;
        btnPlay.disabled = true;
        return;
    }

    // 预定义的语言和默认语音映射
    const languageVoices = {
        'en': {
            defaultFemale: 'Microsoft Zira Desktop - English (United States)',
            defaultMale: 'Microsoft David Desktop - English (United States)',
            voices: [
                'Microsoft Zira Desktop - English (United States)',
                'Microsoft David Desktop - English (United States)',
                'Google US English',
                'Alex',
                'Samantha',
                'Daniel',
                'Karen',
                'Moira',
                'Tessa'
            ]
        },
        'zh': {
            defaultFemale: 'Microsoft Huihui Desktop - Chinese (Simplified)',
            defaultMale: 'Microsoft Kangkang Desktop - Chinese (Simplified)',
            voices: [
                'Microsoft Huihui Desktop - Chinese (Simplified)',
                'Microsoft Yaoyao Desktop - Chinese (Simplified)',
                'Microsoft Kangkang Desktop - Chinese (Simplified)',
                'Ting-Ting',
                'Sin-ji',
                'Google 普通话（中国大陆）'
            ]
        }
    };

    // 加载语音列表
    function loadVoices() {
        voices = synth.getVoices();
        
        if (voices.length === 0) {
            setTimeout(loadVoices, 100);
            return;
        }
        
        // 更新语音选择下拉菜单
        updateVoiceOptions();
    }

    // 更新语音选项
    function updateVoiceOptions() {
        const selectedLanguage = languageSelect.value;
        const selectedGender = genderSelect.value;
        
        // 清空现有选项
        voiceSelect.innerHTML = '';
        
        // 获取当前语言的预定义语音列表
        const languageVoiceList = languageVoices[selectedLanguage].voices || [];
        
        // 过滤出浏览器中实际可用的语音
        const availableVoices = [];
        
        for (const voiceName of languageVoiceList) {
            const voice = voices.find(v => v.name === voiceName || v.voiceURI === voiceName);
            if (voice) {
                // 如果指定了性别，检查语音是否符合
                if (selectedGender === 'any' || 
                    (selectedGender === 'female' && isFemaleVoice(voice)) ||
                    (selectedGender === 'male' && isMaleVoice(voice))) {
                    availableVoices.push(voice);
                }
            }
        }
        
        // 如果没有找到任何语音，尝试使用浏览器中的任何匹配语言的语音
        if (availableVoices.length === 0) {
            const fallbackVoices = voices.filter(voice => 
                voice.lang.startsWith(selectedLanguage) &&
                (selectedGender === 'any' || 
                 (selectedGender === 'female' && isFemaleVoice(voice)) ||
                 (selectedGender === 'male' && isMaleVoice(voice)))
            );
            
            availableVoices.push(...fallbackVoices);
        }
        
        // 添加选项到下拉菜单
        if (availableVoices.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No voices available';
            voiceSelect.appendChild(option);
        } else {
            // 添加默认选项
            const defaultOption = document.createElement('option');
            defaultOption.value = 'default';
            defaultOption.textContent = 'Default Voice';
            voiceSelect.appendChild(defaultOption);
            
            // 添加其他可用语音
            availableVoices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})`;
                voiceSelect.appendChild(option);
            });
            
            // 根据性别选择默认语音
            let defaultVoiceName;
            if (selectedGender === 'male') {
                defaultVoiceName = languageVoices[selectedLanguage].defaultMale;
            } else {
                defaultVoiceName = languageVoices[selectedLanguage].defaultFemale;
            }
            
            const defaultVoiceObj = availableVoices.find(v => v.name === defaultVoiceName);
            if (defaultVoiceObj) {
                voiceSelect.value = defaultVoiceObj.name;
            } else if (availableVoices.length > 0) {
                voiceSelect.value = availableVoices[0].name;
            }
        }
    }

    // 判断是否为女性语音（基于名称的简单启发式方法）
    function isFemaleVoice(voice) {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();
        
        // 英文女性语音特征
        if (lang.includes('en')) {
            return name.includes('female') || 
                   name.includes('woman') || 
                   name.includes('girl') ||
                   name.includes('zira') ||
                   name.includes('samantha') ||
                   name.includes('karen') ||
                   name.includes('moira') ||
                   name.includes('tessa') ||
                   name.includes('victoria') ||
                   name.includes('veena');
        }
        
        // 中文女性语音特征
        if (lang.includes('zh')) {
            return name.includes('female') || 
                   name.includes('woman') || 
                   name.includes('girl') ||
                   name.includes('hui') ||
                   name.includes('yao') ||
                   name.includes('ting') ||
                   name.includes('lin') ||
                   name.includes('mei') ||
                   name.includes('li') ||
                   name.includes('女');
        }
        
        return false;
    }

    // 判断是否为男性语音（基于名称的简单启发式方法）
    function isMaleVoice(voice) {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();
        
        // 英文男性语音特征
        if (lang.includes('en')) {
            return name.includes('male') || 
                   name.includes('man') || 
                   name.includes('boy') ||
                   name.includes('david') ||
                   name.includes('alex') ||
                   name.includes('daniel') ||
                   name.includes('tom') ||
                   name.includes('paul') ||
                   name.includes('mark');
        }
        
        // 中文男性语音特征
        if (lang.includes('zh')) {
            return name.includes('male') || 
                   name.includes('man') || 
                   name.includes('boy') ||
                   name.includes('kang') ||
                   name.includes('gang') ||
                   name.includes('强') ||
                   name.includes('刚') ||
                   name.includes('勇') ||
                   name.includes('男');
        }
        
        return false;
    }

    // 语音加载处理
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
    }

    // 初始加载语音
    loadVoices();

    // 事件监听器
    languageSelect.addEventListener('change', function() {
        updateVoiceOptions();
        
        // 根据选择的语言更新示例文本
        if (this.value === 'zh') {
            textInput.value = '欢迎使用文本转语音工具，这是一个基于Web Speech API的纯前端实现，可以直接在浏览器中运行。';
        } else {
            textInput.value = 'Welcome to the Text-to-Speech tool. This is a pure frontend implementation based on the Web Speech API that runs directly in the browser.';
        }
    });
    
    genderSelect.addEventListener('change', updateVoiceOptions);
    
    rateInput.addEventListener('input', () => {
        rateValue.textContent = rateInput.value;
    });

    pitchInput.addEventListener('input', () => {
        pitchValue.textContent = pitchInput.value;
    });

    volumeInput.addEventListener('input', () => {
        volumeValue.textContent = volumeInput.value;
    });

    // 播放语音
    btnPlay.addEventListener('click', () => {
        // 在某些浏览器中，需要用户交互后才能播放语音
        if (synth.speaking) {
            synth.resume();
            status.textContent = '继续播放';
            status.className = 'status speaking';
            btnPause.disabled = false;
            btnPlay.disabled = true;
            return;
        }

        if (textInput.value !== '') {
            utterance = new SpeechSynthesisUtterance(textInput.value);
            
            // 获取选中的语音
            let selectedVoice = null;
            if (voiceSelect.value === 'default') {
                // 使用默认语音
                const defaultVoiceName = genderSelect.value === 'male' ? 
                    languageVoices[languageSelect.value].defaultMale : 
                    languageVoices[languageSelect.value].defaultFemale;
                
                selectedVoice = voices.find(v => v.name === defaultVoiceName);
            } else {
                // 使用用户选择的语音
                selectedVoice = voices.find(v => v.name === voiceSelect.value);
            }
            
            // 如果找到了语音，使用它；否则使用系统默认语音
            if (selectedVoice) {
                utterance.voice = selectedVoice;
                utterance.lang = selectedVoice.lang;
            } else {
                // 设置默认语言
                utterance.lang = languageSelect.value === 'zh' ? 'zh-CN' : 'en-US';
            }
            
            utterance.rate = parseFloat(rateInput.value);
            utterance.pitch = parseFloat(pitchInput.value);
            utterance.volume = parseFloat(volumeInput.value);
            
            utterance.onstart = function() {
                status.textContent = '正在播放...';
                status.className = 'status speaking';
                btnPause.disabled = false;
                btnStop.disabled = false;
                btnPlay.disabled = true;
            };
            
            utterance.onend = function() {
                status.textContent = '播放完成';
                status.className = 'status';
                btnPause.disabled = true;
                btnStop.disabled = true;
                btnPlay.disabled = false;
            };
            
            utterance.onerror = function(event) {
                console.error('Speech synthesis error:', event);
                status.textContent = '播放出错: ' + event.error;
                status.className = 'status paused';
                btnPause.disabled = true;
                btnStop.disabled = true;
                btnPlay.disabled = false;
                
                // 显示浏览器支持提示
                browserSupport.classList.remove('hidden');
            };
            
            try {
                synth.speak(utterance);
            } catch (error) {
                console.error('Error speaking:', error);
                status.textContent = '播放失败: ' + error.message;
                status.className = 'status paused';
                
                // 显示浏览器支持提示
                browserSupport.classList.remove('hidden');
            }
        }
    });

    // 暂停语音
    btnPause.addEventListener('click', () => {
        if (synth.speaking && !synth.paused) {
            synth.pause();
            status.textContent = '已暂停';
            status.className = 'status paused';
            btnPause.disabled = true;
            btnPlay.disabled = false;
        }
    });

    // 停止语音
    btnStop.addEventListener('click', () => {
        if (synth.speaking) {
            synth.cancel();
            status.textContent = '已停止';
            status.className = 'status';
            btnPause.disabled = true;
            btnStop.disabled = true;
            btnPlay.disabled = false;
        }
    });

    // 添加页面点击事件处理，以激活语音合成
    document.body.addEventListener('click', function() {
        // 尝试播放一个非常简短的无声语音来激活API
        if (synth && !synth.speaking) {
            try {
                const testUtterance = new SpeechSynthesisUtterance('');
                testUtterance.volume = 0;
                synth.speak(testUtterance);
                synth.cancel(); // 立即取消
            } catch (error) {
                console.log('Test utterance failed:', error);
            }
        }
    }, { once: true }); // 只执行一次
});
