import { logger } from './errorHandler.js';
import config from './config.js';

class AIService {
  constructor() {
    this.apiKey = config.deepseekApiKey || '';
    this.apiUrl = 'https://api.deepseek.com/v1/chat/completions';
  }

  async callAPI(prompt, model = 'deepseek-chat') { // 使用 deepseek-chat 模型
    if (!config.aiServiceEnabled) {
      logger.debug('[AI 已关闭] 未发起请求');
      return Promise.resolve('（当前已关闭 AI 服务，仅作测试）');
    }
    logger.debug('开始调用 API:', {
      model,
      prompt: prompt.substring(0, 50) + '...',
      url: this.apiUrl
    });
    
    return new Promise((resolve, reject) => {
      uni.request({
        url: this.apiUrl,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        data: {
          model: model,
          messages: [
            {
              role: 'system',
              content: '你是一个英语学习助手，帮助用户学习英语单词。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.6, // R1 建议设为 0.6 以获得更稳定的推理
          stream: false
        },
        success: (response) => {
          logger.debug('API 响应状态:', response.statusCode);
          logger.debug('API 响应数据:', response.data);
          
          if (response.statusCode === 200) {
            const data = response.data;
            if (data && data.choices && data.choices[0] && data.choices[0].message) {
              logger.debug('API 调用成功，返回内容:', data.choices[0].message.content.substring(0, 100) + '...');
              resolve(data.choices[0].message.content);
            } else {
              logger.error('API 响应格式错误:', data);
              resolve('错误: API 响应格式错误');
            }
          } else {
            logger.error('API 报错:', response.data);
            resolve(`错误: ${response.data.error?.message || '未知错误'} (状态码: ${response.statusCode})`);
          }
        },
        fail: (error) => {
          logger.error('网络请求失败:', error);
          resolve('网络请求失败，请检查网络连接或API密钥');
        }
      });
    });
  }

  async analyzeWord(word) {
    const prompt = `请分析以下英语单词的语义，并推荐合适的标签（如"高频"、"作文词"、"口语词"、"学术词"等）：\n\n单词：${word}\n\n分析要求：\n1. 简要解释单词的基本含义\n2. 分析单词的使用场景和适用范围\n3. 推荐2-3个合适的标签\n4. 输出格式清晰，便于程序解析`;

    return await this.callAPI(prompt);
  }

  async generateExample(word, existingWords = []) {
    const existingWordsStr = existingWords.length > 0 ? 
      `用户单词本中已有的其他单词（尽量使用这些单词来加强记忆）：${existingWords.join('、')}` : 
      '用户单词本中暂无其他单词';

    const prompt = `请为以下英语单词生成一个例句，要求：\n\n单词：${word}\n${existingWordsStr}\n\n例句要求：\n1. 高级例句，包含高级单词\n2. 句子不能过于冗长，结构清晰\n3. 句子中包含2-3个考研词库中较难的单词\n4. 例句要像考研的作文题和翻译题，贴近考研考纲\n5. 尽量包含单词本中已有的其他单词，形成反复记忆的效果\n6. 上下文合理，能够展示单词的正确用法\n7. 提供中文翻译`;

    return await this.callAPI(prompt);
  }

  async generateMultipleExamples(word, existingWords = [], count = 3, examStatsText = '') {
    const existingWordsStr = existingWords.length > 0 ? 
      `用户单词本中已有的其他单词（尽量使用这些单词来加强记忆）：${existingWords.join('、')}` : 
      '用户单词本中暂无其他单词';
    const examBlock = examStatsText ? `\n\n【该词在考研真题中的统计，供生成例句时参考】\n${examStatsText}\n` : '';

    const prompt = `请为以下英语单词生成${count}个不同的例句，要求：\n\n单词：${word}\n${existingWordsStr}${examBlock}\n\n例句要求：\n1. 高级例句，包含高级单词\n2. 句子不能过于冗长，结构清晰\n3. 每个句子中包含2-3个考研词库中较难的单词\n4. 例句要像考研的作文题和翻译题，贴近考研考纲\n5. 尽量包含单词本中已有的其他单词，形成反复记忆的效果\n6. 上下文合理，能够展示单词的正确用法\n7. 每个例句都要提供中文翻译\n8. 确保每个例句的场景和结构都不同\n9. 重要单词标记规则：\n   - 目标单词必须用 ** 标记\n   - 每个例句中至少标记2-3个其他考研核心词汇\n   - 标记格式：**单词**，如 "**important**"\n10. 例句要生动形象，贴近现实生活场景，内容有趣，容易记忆\n11. 可以加入具体的场景描述，让例句更有画面感\n12. 输出格式：每个例句一组，英文例句和中文翻译各占一行，不要使用任何分隔符\n\n示例输出：\n英文：在一个阳光明媚的周末，**significant** number of families gathered in the park, enjoying the **vibrant** flowers and **tranquil** atmosphere.\n中文：在一个阳光明媚的周末，**大量**家庭聚集在公园里，欣赏着**鲜艳**的花朵和**宁静**的氛围。`;

    const result = await this.callAPI(prompt);
    
    // 解析生成的例句
    const examples = [];
    const lines = result.split('\n').filter(line => line.trim() !== '');
    
    // 尝试按行对解析，英文和中文交替出现
    for (let i = 0; i < lines.length; i += 2) {
      let english = lines[i].trim();
      let chinese = lines[i + 1] ? lines[i + 1].trim() : '';
      
      // 去掉开头的冒号
      english = english.replace(/^英文：?/, '').trim();
      english = english.replace(/^English：?/, '').trim();
      english = english.replace(/^:/, '').trim();
      chinese = chinese.replace(/^中文：?/, '').trim();
      chinese = chinese.replace(/^Chinese：?/, '').trim();
      chinese = chinese.replace(/^:/, '').trim();
      
      if (english) {
        examples.push({
          english: english,
          chinese: chinese
        });
      }
      
      if (examples.length >= count) {
        break;
      }
    }
    
    // 如果解析失败，尝试其他格式
    if (examples.length === 0) {
      // 尝试使用 | 分隔
      for (let line of lines) {
        let parts = line.split('｜');
        if (parts.length !== 2) {
          parts = line.split('|');
        }
        
        if (parts.length === 2) {
          let english = parts[0].trim();
          let chinese = parts[1].trim();
          
          // 去掉开头的冒号
          english = english.replace(/^英文：?/, '').trim();
          english = english.replace(/^English：?/, '').trim();
          english = english.replace(/^:/, '').trim();
          chinese = chinese.replace(/^中文：?/, '').trim();
          chinese = chinese.replace(/^Chinese：?/, '').trim();
          chinese = chinese.replace(/^:/, '').trim();
          
          examples.push({
            english: english,
            chinese: chinese
          });
        }
        
        if (examples.length >= count) {
          break;
        }
      }
    }
    
    // 如果仍然解析失败，生成默认例句
    if (examples.length === 0) {
      for (let i = 0; i < count; i++) {
        examples.push({
          english: `Example ${i + 1}: This is a sentence with ${word}.`,
          chinese: `例句 ${i + 1}：这是一个包含 ${word} 的句子。`
        });
      }
    }

    return examples;
  }

  async generateReviewSuggestion(words) {
    if (words.length === 0) {
      return '单词本中暂无单词，建议开始添加单词进行学习。';
    }

    const wordStats = words.map(word => {
      return {
        word: word.english,
        errorRate: word.error_rate || 0,
        reviewFreq: word.review_frequency || 0,
        viewCount: word.view_count || 0,
        importance: word.importance || 3
      };
    });

    const prompt = `请根据以下单词的学习数据，生成一段个性化的学习报告和建议：\n\n单词学习数据：\n${wordStats.map(w => `${w.word} - 错误率: ${w.errorRate}%, 复习频率: ${w.reviewFreq}, 查看次数: ${w.viewCount}, 重要性: ${w.importance}星`).join('\n')}\n\n报告要求：\n1. 分析用户的学习情况\n2. 指出需要重点关注的单词\n3. 提供具体的学习建议\n4. 给出合理的复习计划\n5. 语言亲切自然，有针对性`;

    return await this.callAPI(prompt);
  }

  async generateAntonyms(word, count = 3) {
    const prompt = `请为以下英语单词生成${count}个反义词，并为每个反义词生成一个例句。\n\n单词：${word}\n\n要求：\n1. 选择${count}个最常见、最实用的反义词\n2. 每个反义词需要包含：英文、中文释义、一个英文例句（带中文翻译）\n3. 例句要像考研英语风格，包含高级词汇\n4. 每个例句中用 ** 标记目标反义词和2-3个其他考研核心词汇\n5. 输出格式：每组反义词包含4行：反义词、中文、英文例句、中文翻译\n\n示例输出：\n反义词：minor\n中文：次要的，不重要的\n例句：The **minor** issue was **overlooked** in the **initial** report.\n中文翻译：这一**次要**问题在**最初**的报告中**被忽视**了。`;

    const result = await this.callAPI(prompt);
    const antonyms = [];
    const lines = (result || '').split(/\r?\n/).filter(line => line.trim());
    for (let i = 0; i < lines.length; i += 4) {
      let antonym = lines[i]?.replace(/^反义词：?/, '').trim() || '';
      let chinese = lines[i + 1]?.replace(/^中文：?/, '').trim() || '';
      let example = lines[i + 2]?.replace(/^例句：?/, '').trim() || '';
      let exampleChinese = lines[i + 3]?.replace(/^中文翻译：?/, '').trim() || '';
      if (antonym && chinese) {
        antonyms.push({
          antonym,
          chinese,
          example: example || '',
          exampleChinese: exampleChinese || ''
        });
      }
      if (antonyms.length >= count) break;
    }
    if (antonyms.length === 0) {
      for (let i = 0; i < count; i++) {
        antonyms.push({
          antonym: `antonym${i + 1}`,
          chinese: '反义词',
          example: '',
          exampleChinese: ''
        });
      }
    }
    return antonyms;
  }

  async generateSynonyms(word, existingWords = [], count = 3) {
    const existingWordsStr = existingWords.length > 0 ? 
      `用户单词本中已有的其他单词：${existingWords.join('、')}` : 
      '用户单词本中暂无其他单词';

    const prompt = `请为以下英语单词生成${count}个近义词或同义词，并为每个近义词生成一个例句。\n\n单词：${word}\n${existingWordsStr}\n\n要求：\n1. 选择3个最常见、最实用的近义词或同义词\n2. 每个近义词需要包含：英文、中文释义、一个英文例句（带中文翻译）\n3. 例句要像考研英语风格，包含高级词汇\n4. 每个例句中用 **标记目标近义词和2-3个其他考研核心词汇\n5. 输出格式：每组近义词包含4行：近义词、中文、英文例句、中文翻译\n\n示例输出：\n近义词：significant\n中文：重要的，重大的\n例句：The **significant** discovery changed the **entire** scientific community's understanding of **ancient** civilizations.\n中文翻译：这一**重大**发现改变了**整个**科学界对**古代**文明的理解。`;

    const result = await this.callAPI(prompt);
    
    const synonyms = [];
    const lines = result.split('\n').filter(line => line.trim() !== '');
    
    for (let i = 0; i < lines.length; i += 4) {
      let synonym = lines[i]?.replace(/^近义词：?/, '').trim() || '';
      let chinese = lines[i + 1]?.replace(/^中文：?/, '').trim() || '';
      let example = lines[i + 2]?.replace(/^例句：?/, '').trim() || '';
      let exampleChinese = lines[i + 3]?.replace(/^中文翻译：?/, '').trim() || '';
      
      if (synonym && chinese) {
        synonyms.push({
          synonym: synonym,
          chinese: chinese,
          example: example || '',
          exampleChinese: exampleChinese || ''
        });
      }
      
      if (synonyms.length >= count) {
        break;
      }
    }
    
    if (synonyms.length === 0) {
      for (let i = 0; i < count; i++) {
        synonyms.push({
          synonym: `synonym${i + 1}`,
          chinese: `近义词${i + 1}`,
          example: `Example with ${word}.`,
          exampleChinese: `例句翻译${i + 1}`
        });
      }
    }

    return synonyms;
  }

  async generateExamplesAndSynonyms(word, existingWords = [], examStatsText = '') {
    const existingWordsStr = existingWords.length > 0 ? 
      `用户单词本中已有的其他单词（尽量使用这些单词来加强记忆）：${existingWords.join('、')}` : 
      '用户单词本中暂无其他单词';
    const examBlock = examStatsText ? `\n\n【该词在考研真题中的统计，供生成例句时参考】\n${examStatsText}\n` : '';

    const prompt = `请为以下英语单词生成3个不同的例句，同时提供3个常用近义词，每个近义词需包含例句。\n\n单词：${word}\n${existingWordsStr}${examBlock}\n\n=== 第一部分：例句要求 ===\n1. 高级例句，包含高级单词\n2. 句子不能过于冗长，结构清晰\n3. 每个句子中包含2-3个考研词库中较难的单词\n4. 例句要像考研的作文题和翻译题，贴近考研考纲\n5. 尽量包含单词本中已有的其他单词，形成反复记忆的效果\n6. 上下文合理，能够展示单词的正确用法\n7. 每个例句都要提供中文翻译\n8. 确保每个例句的场景和结构都不同\n9. 重要单词标记规则：\n   - 目标单词必须用 ** 标记\n   - 每个例句中至少标记2-3个其他考研核心词汇\n   - 标记格式：**单词**，如 "**important**"\n10. 例句要生动形象，贴近现实生活场景，内容有趣，容易记忆\n11. 可以加入具体的场景描述，让例句更有画面感\n\n=== 第二部分：近义词要求 ===
请另外提供 3 个该单词的常用近义词。
每个近义词需包含：
- synonym: 近义词英文
- chinese: 中文翻译
- example: 该近义词的一个独立英文例句
- exampleChinese: 该例句的中文翻译

=== 数据返回格式 ===
为了方便程序解析，请【严格】返回 JSON 格式，不要包含 Markdown 代码块。格式如下：
{ 
  "examples": [ 
    {"english": "例句1英文", "chinese": "例句1中文"}, 
    {"english": "例句2英文", "chinese": "例句2中文"}, 
    {"english": "例句3英文", "chinese": "例句3中文"} 
  ], 
  "synonyms": [ 
    {"synonym": "近义词1", "chinese": "翻译1", "example": "近义词1的例句", "exampleChinese": "近义词1例句的中文"}, 
    {"synonym": "近义词2", "chinese": "翻译2", "example": "近义词2的例句", "exampleChinese": "近义词2例句的中文"}, 
    {"synonym": "近义词3", "chinese": "翻译3", "example": "近义词3的例句", "exampleChinese": "近义词3例句的中文"} 
  ] 
}`;

    const result = await this.callAPI(prompt);
    
    logger.debug('AI返回的原始内容:', result);
    
    try {
      let jsonStr = result;
      // 尝试提取 JSON
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      
      // 尝试解析 JSON
      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (e1) {
        // 如果直接解析失败，尝试替换字段名后解析
        jsonStr = jsonStr.replace(/"word":/g, '"synonym":').replace(/"translation":/g, '"chinese":');
        try {
          parsed = JSON.parse(jsonStr);
        } catch (e2) {
          logger.error('替换字段名后仍解析失败:', e2);
          return { examples: [], synonyms: [] };
        }
      }
      
      logger.debug('解析后的JSON:', parsed);
      
      // 标准化 synonyms 字段名
      const normalizedSynonyms = (parsed.synonyms || []).map(item => ({
        synonym: item.synonym || item.word || '',
        chinese: item.chinese || item.translation || '',
        example: item.example || '',
        exampleChinese: item.exampleChinese || ''
      }));
      
      return {
        examples: parsed.examples || [],
        synonyms: normalizedSynonyms
      };
    } catch (e) {
      logger.error('解析JSON失败:', e);
    }
    
    return {
      examples: [],
      synonyms: []
    };
  }

  async generateSynonymContrast(word, synonyms = []) {
    const synonymText = Array.isArray(synonyms) && synonyms.length
      ? synonyms.map((item) => `${item.synonym || ''}(${item.chinese || ''})`).filter(Boolean).join('、')
      : '暂无近义词';
    const prompt = `请为英语单词 ${word} 生成一段简洁的近义词辨析说明。\n已知近义词：${synonymText}\n要求：\n1. 重点说明语气、正式度、常见搭配或适用语境差异\n2. 控制在 2-4 句\n3. 用中文输出，适合考研背单词场景`;
    const result = await this.callAPI(prompt);
    return String(result || '').trim();
  }

  async generateWordFamily(word) {
    const prompt = `请为英语单词 ${word} 生成词族与搭配学习卡。严格返回 JSON，不要 Markdown。\n格式：{"derivatives":[{"word":"派生词","chinese":"中文","hint":"简短提示"}],"collocations":[{"phrase":"搭配","chinese":"中文"}],"memory_tip":"一句话记忆提示"}\n要求：\n1. derivatives 返回 3-5 个高价值派生词或同词根词\n2. collocations 返回 3-5 个常见搭配\n3. 内容偏考研英语高频场景`;
    const result = await this.callAPI(prompt);
    try {
      const jsonMatch = String(result || '').match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : result);
      return {
        derivatives: Array.isArray(parsed.derivatives) ? parsed.derivatives : [],
        collocations: Array.isArray(parsed.collocations) ? parsed.collocations : [],
        memory_tip: parsed.memory_tip || '',
      };
    } catch (_) {
      return { derivatives: [], collocations: [], memory_tip: '' };
    }
  }
}

export default new AIService();