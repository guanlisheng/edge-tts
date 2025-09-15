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
    let voicesLoaded = false;

    // 检查浏览器支持
    if (!synth) {
        showError('您的浏览器不支持语音合成功能');
        browserSupport.classList.remove('hidden');
        disableAllControls();
        return;
    }

    // 预定义的语言和默认语音映射
    const languageVoices = {
        'en': {
            defaultFemale: 'Microsoft Zira Desktop - English (United States)',
            defaultMale: 'Microsoft David Desktop - English (United States)',
            langCode: 'en-US'
        },
        'zh': {
            defaultFemale: 'Microsoft Huihui Desktop - Chinese (Simplified)',
            defaultMale: 'Microsoft Kangkang Desktop - Chinese (Simplified)',
            langCode: 'zh-CN'
        }
    };

    // 显示错误信息
    function showError(message) {
        status.textContent = message;
        status.className = 'status paused';
    }

    // 禁用所有控件
    function disableAllControls() {
        const controls = [
            textInput, languageSelect, genderSelect, voiceSelect,
            rateInput, pitchInput, volumeInput, btnPlay, btnPause, btnStop
        ];
        controls.forEach(control => {
            if (control) control.disabled = true;
        });
    }

    // 启用控制按钮
    function updateControlButtons(speaking, paused) {
        btnPlay.disabled = speaking && !paused;
        btnPause.disabled = !speaking || paused;
        btnStop.disabled = !speaking;
        
        if (speaking && !paused) {
            btnPlay.textContent = '继续';
            btnPlay.querySelector('.icon').innerHTML = '<path d="M8 5v14l11-7z"/>';
        } else {
            btnPlay.textContent = '播放';
            btnPlay.querySelector('.icon').innerHTML = '<path d="M8 5v14l11-7z"/>';
        }
    }

    // 加载语音列表
    function loadVoices() {
        voices = synth.getVoices();
        
        if (voices.length === 0) {
            if (!voicesLoaded) {
                setTimeout(loadVoices, 100);
            }
            return;
        }
        
        voicesLoaded = true;
        // 更新语音选择下拉菜单
        populateVoiceList();
    }

    // 填充语音列表
    function populateVoiceList() {
        if (!voicesLoaded) return;
        
        // 清空现有选项
        voiceSelect.innerHTML = '';
        
        const selectedLanguage = languageSelect.value;
        const selectedGender = genderSelect.value;
        
        // 获取当前语言的语音
        const langVoices = voices.filter(voice => 
            voice.lang.startsWith(selectedLanguage) || 
            (selectedLanguage === 'zh' && voice.lang.startsWith('zh')) ||
            (selectedLanguage === 'en' && voice.lang.startsWith('en'))
        );
        
        // 按性别过滤
        const genderVoices = selectedGender === 'any' ? 
            langVoices : 
            langVoices.filter(voice => {
                if (selectedGender === 'female') return isFemaleVoice(voice);
                if (selectedGender === 'male') return isMaleVoice(voice);
                return true;
            });
        
        // 添加默认选项
        const defaultOption = document.createElement('option');
        defaultOption.value = 'default';
        defaultOption.textContent = '系统默认语音';
        voiceSelect.appendChild(defaultOption);
        
        // 添加可用语音
        if (genderVoices.length > 0) {
            genderVoices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})`;
                voiceSelect.appendChild(option);
            });
        } else {
            // 如果没有匹配的语音，显示提示
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '未找到匹配的语音';
            voiceSelect.appendChild(option);
        }
        
        // 尝试选择默认语音
        trySelectDefaultVoice(selectedLanguage, selectedGender);
    }

    // 尝试选择默认语音
    function trySelectDefaultVoice(language, gender) {
        const defaultVoiceName = languageVoices[language][gender === 'male' ? 'defaultMale' : 'defaultFemale'];
        const defaultVoice = voices.find(voice => voice.name === defaultVoiceName);
        
        if (defaultVoice) {
            voiceSelect.value = defaultVoiceName;
        } else if (voiceSelect.options.length > 1) {
            voiceSelect.selectedIndex = 1; // 选择第一个可用语音
        }
    }

    // 判断是否为女性语音
    function isFemaleVoice(voice) {
        const femaleKeywords = [
            'female', 'woman', 'girl', 'zira', 'samantha', 'karen', 'moira', 
            'tessa', 'victoria', 'veena', 'hui', 'yao', 'ting', 'lin', 'mei', 'li',
            'female', 'woman', 'girl', '女'
        ];
        return containsAny(voice.name.toLowerCase(), femaleKeywords) || 
               containsAny(voice.voiceURI.toLowerCase(), femaleKeywords);
    }

    // 判断是否为男性语音
    function isMaleVoice(voice) {
        const maleKeywords = [
            'male', 'man', 'boy', 'david', 'alex', 'daniel', 'tom', 'paul', 
            'mark', 'kang', 'gang', '强', '刚', '勇', '男',
            'male', 'man', 'boy'
        ];
        return containsAny(voice.name.toLowerCase(), maleKeywords) || 
               containsAny(voice.voiceURI.toLowerCase(), maleKeywords);
    }

    // 辅助函数：检查字符串是否包含数组中的任何元素
    function containsAny(str, items) {
        return items.some(item => str.includes(item));
    }

    // 语音加载处理
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
    }

    // 初始加载语音
    loadVoices();

    // 事件监听器
    languageSelect.addEventListener('change', function() {
        populateVoiceList();
        
        // 根据选择的语言更新示例文本
        if (this.value === 'zh') {
            textInput.value = '欢迎使用文本转语音工具，这是一个基于Web Speech API的纯前端实现，可以直接在浏览器中运行。';
        } else {
            textInput.value = 'Welcome to the Text-to-Speech tool. This is a pure frontend implementation based on the Web Speech API that runs directly in the browser.';
        }
    });
    
    genderSelect.addEventListener('change', populateVoiceList);
    
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
        if (synth.speaking && synth.paused) {
            synth.resume();
            status.textContent = '继续播放';
            status.className = 'status speaking';
            updateControlButtons(true, false);
            return;
        }

        if (synth.speaking) {
            return; // 已经在播放中
        }

        if (textInput.value.trim() === '') {
            showError('请输入要转换的文本');
            return;
        }

        utterance = new SpeechSynthesisUtterance(textInput.value);
        
        // 设置语音参数
        utterance.rate = parseFloat(rateInput.value);
        utterance.pitch = parseFloat(pitchInput.value);
        utterance.volume = parseFloat(volumeInput.value);
        
        // 设置语言
        const langConfig = languageVoices[languageSelect.value];
        utterance.lang = langConfig ? langConfig.langCode : languageSelect.value;
        
        // 设置语音（如果用户选择了特定语音）
        if (voiceSelect.value !== 'default') {
            const selectedVoice = voices.find(voice => voice.name === voiceSelect.value);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
                utterance.lang = selectedVoice.lang;
            }
        }
        
        utterance.onstart = function() {
            status.textContent = '正在播放...';
            status.className = 'status speaking';
            updateControlButtons(true, false);
        };
        
        utterance.onend = function() {
            status.textContent = '播放完成';
            status.className = 'status';
            updateControlButtons(false, false);
        };
        
        utterance.onerror = function(event) {
            console.error('Speech synthesis error:', event);
            showError('播放出错: ' + event.error);
            updateControlButtons(false, false);
            
            // 显示浏览器支持提示
            browserSupport.classList.remove('hidden');
        };
        
        try {
            synth.speak(utterance);
            updateControlButtons(true, false);
        } catch (error) {
            console.error('Error speaking:', error);
            showError('播放失败: ' + error.message);
            
            // 显示浏览器支持提示
            browserSupport.classList.remove('hidden');
        }
    });

    // 暂停语音
    btnPause.addEventListener('click', () => {
        if (synth.speaking && !synth.paused) {
            synth.pause();
            status.textContent = '已暂停';
            status.className = 'status paused';
            updateControlButtons(true, true);
        }
    });

    // 停止语音
    btnStop.addEventListener('click', () => {
        if (synth.speaking) {
            synth.cancel();
            status.textContent = '已停止';
            status.className = 'status';
            updateControlButtons(false, false);
        }
    });

    // 添加页面点击事件处理，以激活语音合成
    document.addEventListener('click', function initSpeech() {
        // 尝试播放一个非常简短的无声语音来激活API
        if (synth && !synth.speaking) {
            try {
                const testUtterance = new SpeechSynthesisUtterance('');
                testUtterance.volume = 0;
                synth.speak(testUtterance);
                setTimeout(() => synth.cancel(), 10); // 立即取消
            } catch (error) {
                console.log('Test utterance failed:', error);
            }
        }
        
        // 移除事件监听器，只需要执行一次
        document.removeEventListener('click', initSpeech);
    });

    // 初始化控制按钮状态
    updateControlButtons(false, false);
});
