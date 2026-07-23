// src/main/engine/PatHandler.ts
// 拍一拍回应 — 根据角色人设（用户设定的persona）生成回应

// 通用回应池（所有人设都可以用）
const UNIVERSAL_RESPONSES = [
  '嗯？',
  '怎么啦~',
  '在呢',
  '？',
  '哎~'
]

// 根据人设关键词匹配的回应池
const KEYWORD_RESPONSES: Record<string, string[]> = {
  // 温柔类
  '温柔': ['嗯？怎么啦~', '你干嘛呀😊', '在呢在呢~', '拍我干嘛呀~', '想我了吗？', '嘻嘻~', '在哦~', '抱抱~'],
  '体贴': ['嗯？怎么啦~', '在呢~', '想我了吗？', '抱抱~'],
  '撒娇': ['嗯~干嘛', '你干嘛呀~', '拍我干嘛啦', '哼~'],

  // 傲娇类
  '傲娇': ['哼...才不是喜欢被拍呢', '不要随便拍我啦', '...哼', '你、你干嘛啦', '别碰我...才不是害羞呢', '切...'],
  '高冷': ['别碰我', '有事？', '...', '嗯', '干嘛', '说'],
  '冷': ['别碰我', '有事？', '...', '嗯'],

  // 搞笑类
  '搞笑': ['你拍我干嘛！', '啊！谁打我！', '干嘛干嘛！', '你是不是想我了😏', '拍坏了你赔得起吗！', '哎哟~轻点！', '你拍一下不要钱的吗'],
  '活泼': ['你拍我干嘛！', '啊！', '干嘛干嘛！', '嘿嘿~', '你是不是想我了😏'],
  '段子': ['你拍我干嘛！', '啊！谁打我！', '你拍一下不要钱的吗', '拍坏了你赔得起吗'],

  // 可爱类
  '可爱': ['嗯？怎么啦~', '你干嘛呀😊', '嘻嘻~', '拍我干嘛呀~', '嘿嘿~'],
  '甜': ['嗯~怎么啦', '想我了吗？', '抱抱~', '嘻嘻~'],

  // 元气类
  '元气': ['来啦来啦！', '干嘛干嘛！', '在呢在呢！', '你是不是想我了😏'],
  '阳光': ['来啦！', '在呢~', '怎么啦~', '嘿嘿~'],

  // 其他
  '闷骚': ['...干嘛', '哼', '嗯', '...'],
  '毒舌': ['拍我干嘛，手痒？', '你是不是闲的', '...有事说事', '别烦我（才不是）'],
  '女王': ['放肆', '你胆子不小嘛', '哼，下去', '准你拍了吗']
}

export class PatHandler {
  /**
   * 根据角色人设生成拍一拍回应
   */
  getResponse(persona: string, suffix?: string): string {
    // 从人设文本中提取关键词，匹配回应池
    const matchedResponses: string[] = []

    for (const [keyword, responses] of Object.entries(KEYWORD_RESPONSES)) {
      if (persona.includes(keyword)) {
        matchedResponses.push(...responses)
      }
    }

    // 如果没有匹配到关键词，从人设中提取更多风格信息
    if (matchedResponses.length === 0) {
      // 根据人设长度和语气词判断风格
      if (persona.includes('~') || persona.includes('呀') || persona.includes('呢')) {
        // 语气柔和 → 温柔风格
        matchedResponses.push(...KEYWORD_RESPONSES['温柔'])
      } else if (persona.includes('哼') || persona.includes('才不')) {
        // 傲娇风格
        matchedResponses.push(...KEYWORD_RESPONSES['傲娇'])
      } else if (persona.includes('哈哈') || persona.includes('笑') || persona.includes('段子')) {
        // 搞笑风格
        matchedResponses.push(...KEYWORD_RESPONSES['搞笑'])
      } else {
        // 默认用通用回应
        matchedResponses.push(...UNIVERSAL_RESPONSES)
      }
    }

    // 随机选一个回应
    const base = matchedResponses[Math.floor(Math.random() * matchedResponses.length)]

    // 如果有 suffix（如"的头"、"的肩膀"），有一定概率给出特殊回应
    if (suffix && Math.random() < 0.4) {
      const suffixResponses: Record<string, string[]> = {
        '头': ['拍头会变笨的！', '别拍头~', '头疼了都', '头很贵的！'],
        '肩膀': ['靠~', '肩膀给你~', '嗯？', '想靠就靠嘛'],
        '脸': ['干嘛摸我脸！', '脸会红的...', '讨厌~', '不许摸脸！'],
        '肚子': ['肚子不能拍！', '饿了...', '嘿嘿', '肚子是秘密~'],
        '脑袋': ['拍脑袋会变笨的！', '笨了你负责吗', '哼~'],
        '小脑袋': ['拍脑袋会变笨的！', '你才笨呢'],
        '屁股': ['！', '你、你干嘛！', '变态！', '不许碰！']
      }
      const extras = suffixResponses[suffix]
      if (extras) {
        return extras[Math.floor(Math.random() * extras.length)]
      }
    }

    return base
  }
}
