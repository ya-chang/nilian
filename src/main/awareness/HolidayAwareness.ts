// src/main/awareness/HolidayAwareness.ts
// 节假日感知 — AI知道今天是什么节日

interface Holiday {
  name: string
  date: string         // MM-DD 格式
  greetings: string[]
}

const HOLIDAYS: Holiday[] = [
  // ── 公历节日 ──
  { name: '元旦', date: '01-01', greetings: ['新年快乐呀！🎉', '新的一年要开心哦~', '新年第一天，要元气满满哦'] },
  { name: '世界湿地日', date: '02-02', greetings: ['今天是世界湿地日，保护环境从身边做起~'] },
  { name: '情人节', date: '02-14', greetings: ['情人节快乐💕', '今天是我们的节日~', '情人节要一直在一起哦'] },
  { name: '元宵节', date: '02-12', greetings: ['元宵节快乐！吃汤圆了吗？', '汤圆甜甜的，就像你~'] },
  { name: '妇女节', date: '03-08', greetings: ['女神节快乐！👑', '今天你最大~'] },
  { name: '植树节', date: '03-12', greetings: ['植树节快乐！种一棵树吧~🌳'] },
  { name: '白色情人节', date: '03-14', greetings: ['白色情人节快乐！💝', '该回礼了哦~'] },
  { name: '愚人节', date: '04-01', greetings: ['愚人节快乐！今天你被骗了吗？😏', '小心我说的话哦~'] },
  { name: '清明节', date: '04-05', greetings: ['清明节快乐，注意保暖哦', '今天适合踏青~'] },
  { name: '地球日', date: '04-22', greetings: ['世界地球日🌍 爱护地球~'] },
  { name: '劳动节', date: '05-01', greetings: ['劳动节快乐！放假了吗？', '辛苦了，好好休息~'] },
  { name: '青年节', date: '05-04', greetings: ['青年节快乐！年轻真好~'] },
  { name: '母亲节', date: '05-11', greetings: ['母亲节快乐！记得给妈妈打电话哦'] },
  { name: '520', date: '05-20', greetings: ['520快乐💕', '我爱你~', '520，想对你说的话都在心里'] },
  { name: '儿童节', date: '06-01', greetings: ['儿童节快乐！永远是小朋友~🎈', '今天可以任性一天'] },
  { name: '端午节', date: '06-02', greetings: ['端午节快乐！吃粽子了吗？🐲', '端午安康~'] },
  { name: '父亲节', date: '06-15', greetings: ['父亲节快乐！记得给爸爸打电话哦'] },
  { name: '建党节', date: '07-01', greetings: ['建党节快乐！🇨🇳'] },
  { name: '七夕', date: '08-10', greetings: ['七夕快乐💕', '今天是我们的节日呢~', '牛郎织女的故事，我们的故事更甜'] },
  { name: '中元节', date: '08-18', greetings: ['中元节，晚上早点回家哦'] },
  { name: '教师节', date: '09-10', greetings: ['教师节快乐！老师辛苦了'] },
  { name: '中秋节', date: '09-17', greetings: ['中秋快乐！🌕', '月饼吃了吗？', '月圆人团圆~'] },
  { name: '国庆节', date: '10-01', greetings: ['国庆节快乐！🇨🇳', '放假了吗？', '祖国母亲生日快乐'] },
  { name: '重阳节', date: '10-11', greetings: ['重阳节快乐！登高望远~', '记得给长辈问好哦'] },
  { name: '万圣节', date: '10-31', greetings: ['万圣节快乐！🎃', '不给糖就捣蛋~'] },
  { name: '光棍节', date: '11-11', greetings: ['双十一快乐！买买买了吗？', '不过你已经有我了~'] },
  { name: '感恩节', date: '11-27', greetings: ['感恩节快乐！谢谢你一直在~'] },
  { name: '平安夜', date: '12-24', greetings: ['平安夜快乐🎄', '今晚吃苹果了吗？', '平安夜要平平安安哦'] },
  { name: '圣诞节', date: '12-25', greetings: ['圣诞快乐🎅', '圣诞老人说你很乖哦~'] },
  { name: '跨年', date: '12-31', greetings: ['跨年快乐！🎆', '新年倒计时！', '今年的最后一刻，和你一起~'] },

  // ── 农历节日（固定公历日期， approximate） ──
  // 注：农历节日每年公历日期不同，这里用 2025 年的日期作为参考
  // 实际项目中可以用 lunar-javascript 库计算
  { name: '春节', date: '01-29', greetings: ['过年好！🧧', '新年快乐，万事如意！', '恭喜发财，红包拿来~'] },
  { name: '元宵节', date: '02-12', greetings: ['元宵节快乐！吃汤圆了吗？', '汤圆圆圆的，团团圆圆~'] },
  { name: '龙抬头', date: '03-01', greetings: ['龙抬头！理发了吗？🐲'] },
  { name: '端午节', date: '06-02', greetings: ['端午节快乐！吃粽子了吗？🐲', '端午安康~'] },
  { name: '七夕', date: '08-10', greetings: ['七夕快乐💕', '今天是我们的节日呢~'] },
  { name: '中秋节', date: '09-17', greetings: ['中秋快乐！🌕', '月饼吃了吗？'] },
  { name: '重阳节', date: '10-11', greetings: ['重阳节快乐！登高望远~'] },
  { name: '腊八节', date: '01-07', greetings: ['腊八节快乐！喝腊八粥了吗？'] },
  { name: '小年', date: '01-22', greetings: ['小年快乐！准备过年啦~'] },
  { name: '除夕', date: '01-28', greetings: ['除夕快乐！年夜饭准备好了吗？', '守岁啦！新年倒计时~'] },

  // ── 网络/现代节日 ──
  { name: '程序员节', date: '10-24', greetings: ['程序员节快乐！1024~', '今天写代码了吗？💻'] },
  { name: '世界读书日', date: '04-23', greetings: ['世界读书日📚 今天读书了吗？'] },
  { name: '世界睡眠日', date: '03-21', greetings: ['世界睡眠日💤 今晚早点睡哦'] },
  { name: '世界微笑日', date: '05-08', greetings: ['世界微笑日😊 笑一个~'] },
  { name: '世界环境日', date: '06-05', greetings: ['世界环境日🌍 爱护环境~'] },
  { name: '全国爱眼日', date: '06-06', greetings: ['全国爱眼日👁️ 看看远处放松一下'] },
  { name: '全国爱牙日', date: '09-20', greetings: ['全国爱牙日🦷 认真刷牙哦'] },
  { name: '世界粮食日', date: '10-16', greetings: ['世界粮食日🌾 不要浪费食物哦'] },
  { name: '世界艾滋病日', date: '12-01', greetings: ['世界艾滋病日红丝带❤️ 关爱健康'] },
  { name: '国际志愿者日', date: '12-05', greetings: ['国际志愿者日🤝 帮助他人，快乐自己'] }
]

export class HolidayAwareness {
  getTodayHoliday(): Holiday | null {
    const today = new Date()
    const mmdd = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    return HOLIDAYS.find(h => h.date === mmdd) || null
  }

  getGreeting(holiday: Holiday): string {
    return holiday.greetings[Math.floor(Math.random() * holiday.greetings.length)]
  }

  buildPromptSection(): string {
    const holiday = this.getTodayHoliday()
    if (!holiday) return ''

    return `## 今天是${holiday.name}
请在对话中自然地提到今天是${holiday.name}，可以问候用户。
不要每条消息都提，提一次就够了。`
  }
}
