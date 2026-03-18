if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global = uni.requireGlobal();
  ArrayBuffer = global.ArrayBuffer;
  Int8Array = global.Int8Array;
  Uint8Array = global.Uint8Array;
  Uint8ClampedArray = global.Uint8ClampedArray;
  Int16Array = global.Int16Array;
  Uint16Array = global.Uint16Array;
  Int32Array = global.Int32Array;
  Uint32Array = global.Uint32Array;
  Float32Array = global.Float32Array;
  Float64Array = global.Float64Array;
  BigInt64Array = global.BigInt64Array;
  BigUint64Array = global.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  const ON_SHOW = "onShow";
  const ON_HIDE = "onHide";
  const ON_LOAD = "onLoad";
  const ON_READY = "onReady";
  const ON_UNLOAD = "onUnload";
  const ON_BACK_PRESS = "onBackPress";
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  const createLifeCycleHook = (lifecycle, flag = 0) => (hook, target = vue.getCurrentInstance()) => {
    !vue.isInSSRComponentSetup && vue.injectHook(lifecycle, hook, target);
  };
  const onShow = /* @__PURE__ */ createLifeCycleHook(
    ON_SHOW,
    1 | 2
    /* HookFlags.PAGE */
  );
  const onHide = /* @__PURE__ */ createLifeCycleHook(
    ON_HIDE,
    1 | 2
    /* HookFlags.PAGE */
  );
  const onLoad = /* @__PURE__ */ createLifeCycleHook(
    ON_LOAD,
    2
    /* HookFlags.PAGE */
  );
  const onReady = /* @__PURE__ */ createLifeCycleHook(
    ON_READY,
    2
    /* HookFlags.PAGE */
  );
  const onUnload = /* @__PURE__ */ createLifeCycleHook(
    ON_UNLOAD,
    2
    /* HookFlags.PAGE */
  );
  const onBackPress = /* @__PURE__ */ createLifeCycleHook(
    ON_BACK_PRESS,
    2
    /* HookFlags.PAGE */
  );
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$c = {
    __name: "vocal-color-block-selector",
    props: {
      range: { type: Array, default: () => [] },
      value: { type: Number, default: 0 }
    },
    emits: ["change"],
    setup(__props, { expose: __expose, emit: __emit }) {
      __expose();
      const props = __props;
      const emit = __emit;
      const visible = vue.ref(false);
      const currentIndex = vue.ref(0);
      const displayRange = vue.computed(() => {
        const r2 = props.range;
        return Array.isArray(r2) ? r2 : [];
      });
      vue.watch(() => props.value, (v2) => {
        currentIndex.value = Math.max(0, Math.min(Number(v2) || 0, displayRange.value.length - 1));
      }, { immediate: true });
      function open() {
        currentIndex.value = Math.max(0, Math.min(props.value, displayRange.value.length - 1));
        visible.value = true;
      }
      function close() {
        visible.value = false;
      }
      function select(idx) {
        emit("change", { detail: { value: idx } });
        close();
      }
      const __returned__ = { props, emit, visible, currentIndex, displayRange, open, close, select, ref: vue.ref, computed: vue.computed, watch: vue.watch };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$c(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "vocal-selector" }, [
      vue.createElementVNode("view", {
        class: "selector-trigger",
        onClick: $setup.open
      }, [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
      ]),
      $setup.visible ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "selector-overlay",
        onClick: $setup.close
      })) : vue.createCommentVNode("v-if", true),
      $setup.visible ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "selector-drawer"
      }, [
        vue.createElementVNode("view", { class: "drawer-handle" }),
        vue.createElementVNode("scroll-view", {
          "scroll-y": "",
          class: "drawer-body"
        }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.displayRange, (item, idx) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: idx,
                class: vue.normalizeClass(["block-option", { selected: idx === $setup.currentIndex }]),
                onClick: ($event) => $setup.select(idx)
              }, [
                vue.createElementVNode(
                  "text",
                  { class: "block-text" },
                  vue.toDisplayString(item),
                  1
                  /* TEXT */
                )
              ], 10, ["onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ])
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const VocalColorBlockSelector = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["render", _sfc_render$c], ["__scopeId", "data-v-62b10f5c"], ["__file", "E:/vocal/wordbook_new/components/vocal-color-block-selector/vocal-color-block-selector.vue"]]);
  const REVIEW_DEFAULTS = {
    difficulty_score: 0.35,
    stability: 0.6,
    retrievability: 0.92,
    interval_days: 0,
    lapse_count: 0,
    review_count: 0,
    next_review_time: "",
    last_reviewed_at: ""
  };
  const clamp = (num, min, max) => Math.min(max, Math.max(min, num));
  const normalizeReviewFields = (word = {}) => ({
    difficulty_score: clamp(Number(word.difficulty_score ?? REVIEW_DEFAULTS.difficulty_score) || REVIEW_DEFAULTS.difficulty_score, 0.15, 0.98),
    stability: Math.max(0.2, Number(word.stability ?? REVIEW_DEFAULTS.stability) || REVIEW_DEFAULTS.stability),
    retrievability: clamp(Number(word.retrievability ?? REVIEW_DEFAULTS.retrievability) || REVIEW_DEFAULTS.retrievability, 0.05, 0.99),
    interval_days: Math.max(0, Number(word.interval_days ?? REVIEW_DEFAULTS.interval_days) || 0),
    lapse_count: Math.max(0, Number(word.lapse_count ?? REVIEW_DEFAULTS.lapse_count) || 0),
    review_count: Math.max(0, Number(word.review_count ?? word.review_frequency ?? REVIEW_DEFAULTS.review_count) || 0),
    next_review_time: word.next_review_time || "",
    last_reviewed_at: word.last_reviewed_at || ""
  });
  const computeElapsedDays = (word = {}, now = /* @__PURE__ */ new Date()) => {
    const base = word.last_reviewed_at || word.update_time || word.create_time;
    if (!base)
      return 999;
    return Math.max(0, (now - new Date(base)) / (1e3 * 60 * 60 * 24));
  };
  const computeRetrievabilityByStability = (stability, elapsedDays) => {
    const s2 = Math.max(0.2, Number(stability) || REVIEW_DEFAULTS.stability);
    return clamp(Math.exp(-elapsedDays / s2), 0.02, 0.999);
  };
  const scheduleReviewState = (word = {}, isCorrect = false, now = /* @__PURE__ */ new Date()) => {
    const importance = clamp(Number(word.importance) || 3, 0, 5);
    const prev = normalizeReviewFields(word);
    const elapsedDays = computeElapsedDays(word, now);
    const recallProb = computeRetrievabilityByStability(prev.stability, elapsedDays);
    const nextReviewCount = prev.review_count + 1;
    let difficulty = prev.difficulty_score;
    let stability = prev.stability;
    let lapseCount = prev.lapse_count;
    let retrievability = prev.retrievability;
    let intervalDays = prev.interval_days;
    if (isCorrect) {
      difficulty = clamp(
        difficulty - 0.06 + (1 - recallProb) * 0.05 - importance / 100,
        0.15,
        0.95
      );
      stability = Math.max(
        0.5,
        stability * (1.55 + (1 - difficulty) * 0.65 + recallProb * 0.35 + importance * 0.04)
      );
      intervalDays = clamp(stability * (0.7 + (1 - difficulty) * 0.9), 0.5, 90);
      retrievability = 0.97;
    } else {
      difficulty = clamp(
        difficulty + 0.12 + (1 - recallProb) * 0.12 + 0.02 * Math.max(0, 3 - importance),
        0.2,
        0.98
      );
      stability = Math.max(0.2, stability * (0.42 + (1 - difficulty) * 0.22));
      lapseCount += 1;
      intervalDays = 0.125;
      retrievability = 0.35;
    }
    return {
      difficulty_score: Number(difficulty.toFixed(4)),
      stability: Number(stability.toFixed(4)),
      retrievability: Number(retrievability.toFixed(4)),
      interval_days: Number(intervalDays.toFixed(4)),
      lapse_count: lapseCount,
      review_count: nextReviewCount,
      review_frequency: nextReviewCount,
      next_review_time: new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1e3).toISOString(),
      last_reviewed_at: now.toISOString()
    };
  };
  const calculateReviewPriority = (word = {}, hardMode = false) => {
    const now = /* @__PURE__ */ new Date();
    const fields = normalizeReviewFields(word);
    const elapsedDays = computeElapsedDays(word, now);
    const forgetProb = 1 - computeRetrievabilityByStability(fields.stability, elapsedDays);
    const dueAt = fields.next_review_time ? new Date(fields.next_review_time) : new Date(word.last_reviewed_at || word.update_time || word.create_time || now.toISOString());
    const overdueDays = Math.max(0, (now - dueAt) / (1e3 * 60 * 60 * 24));
    const importance = clamp(Number(word.importance) || 3, 0, 5);
    let score = forgetProb * 55 + fields.difficulty_score * 22 + overdueDays * 12 + fields.lapse_count * 8 + importance * 4;
    if (hardMode)
      score += forgetProb * 10 + fields.difficulty_score * 8 + (word.error_rate || 0) * 0.2;
    return {
      score,
      forget_probability: Number(forgetProb.toFixed(4)),
      overdue_days: Number(overdueDays.toFixed(3))
    };
  };
  const calculateMastery = (word = {}) => {
    const fields = normalizeReviewFields(word);
    const elapsedDays = computeElapsedDays(word, /* @__PURE__ */ new Date());
    const forgetProbability = 1 - computeRetrievabilityByStability(fields.stability, elapsedDays);
    return clamp(
      Math.round((1 - (forgetProbability * 0.72 + fields.difficulty_score * 0.28)) * 100),
      1,
      99
    );
  };
  const sqlLiteral = (value) => {
    if (value === null || value === void 0)
      return "NULL";
    if (typeof value === "number")
      return Number.isFinite(value) ? String(value) : "NULL";
    if (typeof value === "boolean")
      return value ? "1" : "0";
    return `'${String(value).replace(/'/g, "''")}'`;
  };
  const bindSql = (sql, params = []) => {
    let i2 = 0;
    return String(sql).replace(/\?/g, () => sqlLiteral(params[i2++]));
  };
  const toJsonString = (value, fallback = []) => {
    if (typeof value === "string")
      return value;
    try {
      return JSON.stringify(value ?? fallback);
    } catch (_2) {
      return JSON.stringify(fallback);
    }
  };
  const parseJsonSafe$1 = (jsonStr, fallback = null) => {
    if (!jsonStr)
      return fallback;
    try {
      return JSON.parse(jsonStr);
    } catch (_2) {
      return fallback;
    }
  };
  const H5_STORAGE_KEY$1 = "wordbook_h5_words";
  const getH5Words$1 = () => {
    try {
      const raw = uni.getStorageSync(H5_STORAGE_KEY$1);
      return raw ? JSON.parse(raw) : [];
    } catch (e2) {
      formatAppLog("error", "at src/utils/databaseAdapter.js:18", "[H5Adapter] 读取 H5 单词列表失败:", e2);
      return [];
    }
  };
  const setH5Words$1 = (words) => {
    try {
      uni.setStorageSync(H5_STORAGE_KEY$1, JSON.stringify(words));
    } catch (e2) {
      formatAppLog("error", "at src/utils/databaseAdapter.js:30", "[H5Adapter] 保存 H5 单词列表失败:", e2);
    }
  };
  class H5DatabaseAdapter {
    async init() {
      return Promise.resolve();
    }
    async query(sql, params = []) {
      return Promise.resolve([]);
    }
    async execute(sql, params = []) {
      return Promise.resolve();
    }
    async getWords() {
      return Promise.resolve(getH5Words$1());
    }
    async addWord(word) {
      if (!word.english)
        throw new Error("单词不能为空");
      const words = getH5Words$1();
      const newWord = {
        ...word,
        id: Date.now().toString(),
        create_time: (/* @__PURE__ */ new Date()).toISOString(),
        update_time: (/* @__PURE__ */ new Date()).toISOString(),
        examples: word.examples || [],
        synonyms: word.synonyms || [],
        antonyms: word.antonyms || [],
        view_count: 0
      };
      words.unshift(newWord);
      setH5Words$1(words);
      return Promise.resolve(newWord);
    }
    async updateWord(id, updates) {
      if (!id)
        throw new Error("无效 id");
      const words = getH5Words$1();
      const idx = words.findIndex((w2) => w2.id === id);
      if (idx === -1)
        throw new Error("未找到单词");
      words[idx] = {
        ...words[idx],
        ...updates,
        update_time: (/* @__PURE__ */ new Date()).toISOString()
      };
      setH5Words$1(words);
      return Promise.resolve();
    }
    async deleteWord(id) {
      if (!id)
        throw new Error("无效 id");
      const words = getH5Words$1().filter((w2) => w2.id !== id);
      setH5Words$1(words);
      return Promise.resolve();
    }
    async getWordById(id) {
      if (!id)
        return Promise.resolve(null);
      const words = getH5Words$1();
      const found = words.find((w2) => w2.id === id);
      return Promise.resolve(found || null);
    }
    async getWordByEnglish(english) {
      if (!english)
        return Promise.resolve(null);
      const key = String(english).trim().toLowerCase();
      const words = getH5Words$1();
      const found = words.find((w2) => (w2.english || "").toLowerCase() === key);
      return Promise.resolve(found || null);
    }
    async getRandomDistractors(excludeId, count = 3) {
      const words = getH5Words$1().filter((w2) => w2.id !== excludeId);
      for (let i2 = words.length - 1; i2 > 0; i2--) {
        const j2 = Math.floor(Math.random() * (i2 + 1));
        [words[i2], words[j2]] = [words[j2], words[i2]];
      }
      return Promise.resolve(words.slice(0, count).map((w2) => w2.chinese));
    }
    async getWordsByTag(tag, excludeId) {
      if (!tag || !tag.trim())
        return Promise.resolve([]);
      const t2 = tag.trim();
      const words = getH5Words$1();
      return Promise.resolve(
        words.filter((w2) => w2.id !== excludeId && (w2.tags || "").split(/[,，\s]+/).map((x) => x.trim()).filter(Boolean).includes(t2)).slice(0, 20).map((w2) => ({ id: w2.id, english: w2.english, chinese: w2.chinese }))
      );
    }
  }
  class AppDatabaseAdapter {
    constructor(dbName = "wordbook_db", dbPath = "_doc/wordbook.db") {
      this.dbName = dbName;
      this.dbPath = dbPath;
      this.isOpen = false;
    }
    async init() {
      formatAppLog("log", "at src/utils/databaseAdapter.js:154", "[AppAdapter] init() 被调用");
      if (this.isOpen) {
        formatAppLog("log", "at src/utils/databaseAdapter.js:156", "[AppAdapter] 数据库已打开，跳过初始化");
        return Promise.resolve();
      }
      try {
        formatAppLog("log", "at src/utils/databaseAdapter.js:161", "[AppAdapter] 检查数据库是否已打开...");
        formatAppLog("log", "at src/utils/databaseAdapter.js:162", "[AppAdapter] plus:", typeof plus);
        formatAppLog("log", "at src/utils/databaseAdapter.js:163", "[AppAdapter] plus.sqlite:", typeof (plus == null ? void 0 : plus.sqlite));
        if (plus && plus.sqlite && plus.sqlite.isOpenDatabase({ name: this.dbName, path: this.dbPath })) {
          formatAppLog("log", "at src/utils/databaseAdapter.js:166", "[AppAdapter] 数据库已打开");
          this.isOpen = true;
          return Promise.resolve();
        }
        formatAppLog("log", "at src/utils/databaseAdapter.js:171", "[AppAdapter] 打开数据库...");
        await this.openDatabase();
        this.isOpen = true;
        formatAppLog("log", "at src/utils/databaseAdapter.js:174", "[AppAdapter] 数据库打开成功");
        return Promise.resolve();
      } catch (error) {
        formatAppLog("error", "at src/utils/databaseAdapter.js:177", "[AppAdapter] 初始化失败:", error);
        throw error;
      }
    }
    openDatabase() {
      return new Promise((resolve, reject) => {
        plus.sqlite.openDatabase({
          name: this.dbName,
          path: this.dbPath,
          success: () => {
            formatAppLog("log", "at src/utils/databaseAdapter.js:188", "[AppAdapter] 数据库打开成功");
            resolve();
          },
          fail: (e2) => {
            formatAppLog("error", "at src/utils/databaseAdapter.js:192", "[AppAdapter] 数据库打开失败:", e2);
            reject(e2);
          }
        });
      });
    }
    async query(sql, params = []) {
      await this.init();
      return new Promise((resolve) => {
        plus.sqlite.selectSql({
          name: this.dbName,
          sql: bindSql(sql, params),
          success: (data) => resolve(data || []),
          fail: (e2) => {
            formatAppLog("error", "at src/utils/databaseAdapter.js:208", "[AppAdapter] 查询失败:", e2);
            resolve([]);
          }
        });
      });
    }
    async execute(sql, params = []) {
      await this.init();
      return new Promise((resolve, reject) => {
        plus.sqlite.executeSql({
          name: this.dbName,
          sql: bindSql(sql, params),
          success: resolve,
          fail: reject
        });
      });
    }
    async transaction(callback) {
      await this.init();
      try {
        await this.execute("BEGIN TRANSACTION");
        await callback();
        await this.execute("COMMIT");
      } catch (error) {
        await this.execute("ROLLBACK").catch(() => {
        });
        throw error;
      }
    }
    async getWords() {
      const data = await this.query("SELECT * FROM words ORDER BY create_time DESC");
      return data || [];
    }
    async addWord(word) {
      if (!word.english)
        return Promise.reject("单词不能为空");
      const wordId = Date.now().toString();
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const sql = `INSERT INTO words (
      id, english, chinese, tags, source_page, year, importance, repeat_count, view_count,
      difficulty_score, stability, retrievability, interval_days, lapse_count, review_count,
      next_review_time, last_reviewed_at, examples, synonyms, antonyms, create_time, update_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [
        wordId,
        word.english,
        word.chinese || "",
        word.tags || "",
        word.source_page || "",
        word.year || "",
        word.importance || 3,
        word.repeat_count || 1,
        word.view_count != null ? word.view_count : 0,
        word.difficulty_score || 0.35,
        word.stability || 0.6,
        word.retrievability || 0.92,
        word.interval_days || 0,
        word.lapse_count || 0,
        word.review_count || 0,
        word.next_review_time || "",
        word.last_reviewed_at || "",
        toJsonString(word.examples || []),
        toJsonString(word.synonyms || []),
        toJsonString(word.antonyms || []),
        now,
        now
      ];
      await this.execute(sql, params);
      return Promise.resolve({ ...word, id: wordId });
    }
    async updateWord(id, updates) {
      if (!id)
        return Promise.reject("无效 id");
      const fields = [];
      const params = [];
      for (const [key, value] of Object.entries(updates)) {
        if (value === void 0)
          continue;
        fields.push(`${key} = ?`);
        params.push(value);
      }
      if (fields.length === 0)
        return Promise.resolve();
      fields.push("update_time = ?");
      params.push((/* @__PURE__ */ new Date()).toISOString());
      params.push(id);
      const sql = `UPDATE words SET ${fields.join(", ")} WHERE id = ?`;
      await this.execute(sql, params);
      return Promise.resolve();
    }
    async deleteWord(id) {
      if (!id)
        return Promise.reject("无效 id");
      await this.execute("DELETE FROM words WHERE id = ?", [id]);
      return Promise.resolve();
    }
    async getWordById(id) {
      if (!id)
        return Promise.resolve(null);
      const data = await this.query("SELECT * FROM words WHERE id = ?", [id]);
      return Promise.resolve(data && data.length ? data[0] : null);
    }
    async getWordByEnglish(english) {
      if (!english)
        return Promise.resolve(null);
      const key = String(english).trim().toLowerCase();
      const data = await this.query("SELECT * FROM words WHERE LOWER(english) = ? LIMIT 1", [key]);
      return Promise.resolve(data && data.length ? data[0] : null);
    }
    async getRandomDistractors(excludeId, count = 3) {
      const data = await this.query(
        "SELECT id, chinese FROM words WHERE id != ? ORDER BY RANDOM() LIMIT ?",
        [excludeId, count + 5]
      );
      return Promise.resolve((data || []).slice(0, count).map((item) => item.chinese));
    }
    async getWordsByTag(tag, excludeId) {
      if (!tag || !tag.trim())
        return Promise.resolve([]);
      const t2 = tag.trim();
      const data = await this.query(
        "SELECT id, english, chinese, tags FROM words WHERE (tags LIKE ? OR tags LIKE ? OR tags LIKE ? OR tags = ?) LIMIT 30",
        [`%,${t2},%`, `${t2},%`, `%,${t2}`, t2]
      );
      return Promise.resolve(
        (data || []).filter((item) => item.id !== excludeId && (item.tags || "").split(/[,，\s]+/).map((x) => x.trim()).filter(Boolean).includes(t2)).slice(0, 20).map((item) => ({ id: item.id, english: item.english, chinese: item.chinese }))
      );
    }
  }
  function createDatabaseAdapter() {
    formatAppLog("log", "at src/utils/databaseAdapter.js:363", "[databaseAdapter] 检查运行环境...");
    formatAppLog("log", "at src/utils/databaseAdapter.js:364", "[databaseAdapter] typeof plus:", typeof plus);
    formatAppLog("log", "at src/utils/databaseAdapter.js:365", "[databaseAdapter] typeof plus.sqlite:", typeof (plus == null ? void 0 : plus.sqlite));
    const isApp2 = typeof plus !== "undefined" && typeof plus.sqlite !== "undefined";
    formatAppLog("log", "at src/utils/databaseAdapter.js:369", "[databaseAdapter] isApp:", isApp2);
    if (isApp2) {
      formatAppLog("log", "at src/utils/databaseAdapter.js:372", "[databaseAdapter] 使用 AppDatabaseAdapter");
      return new AppDatabaseAdapter();
    } else {
      formatAppLog("log", "at src/utils/databaseAdapter.js:375", "[databaseAdapter] 使用 H5DatabaseAdapter");
      return new H5DatabaseAdapter();
    }
  }
  const H5_STORAGE_KEY = "wordbook_h5_words";
  const H5_MASTERED_KEY = "wordbook_h5_mastered_words";
  const parseWord = (item) => {
    let examples = [], synonyms = [], antonyms = [];
    if (Array.isArray(item.examples))
      examples = item.examples;
    else if (item.examples)
      examples = parseJsonSafe$1(item.examples, []);
    if (Array.isArray(item.synonyms))
      synonyms = item.synonyms;
    else if (item.synonyms)
      synonyms = parseJsonSafe$1(item.synonyms, []);
    if (Array.isArray(item.antonyms))
      antonyms = item.antonyms;
    else if (item.antonyms)
      antonyms = parseJsonSafe$1(item.antonyms, []);
    return { ...item, ...normalizeReviewFields(item), examples, synonyms, antonyms };
  };
  const getH5Words = () => {
    try {
      const raw = uni.getStorageSync(H5_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e2) {
      formatAppLog("error", "at src/utils/db_v2.js:46", "[db] 读取 H5 单词列表失败:", e2);
      return [];
    }
  };
  const setH5Words = (words) => {
    try {
      uni.setStorageSync(H5_STORAGE_KEY, JSON.stringify(words));
    } catch (e2) {
      formatAppLog("error", "at src/utils/db_v2.js:55", "[db] 保存 H5 单词列表失败:", e2);
    }
  };
  const getH5MasteredWords = () => {
    try {
      const raw = uni.getStorageSync(H5_MASTERED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e2) {
      return [];
    }
  };
  const setH5MasteredWords = (words) => {
    try {
      uni.setStorageSync(H5_MASTERED_KEY, JSON.stringify(words));
    } catch (e2) {
    }
  };
  class DatabaseManager {
    constructor() {
      formatAppLog("log", "at src/utils/db_v2.js:79", "[db] DatabaseManager 构造函数被调用");
      this.adapter = createDatabaseAdapter();
      this.isH5 = null;
      formatAppLog("log", "at src/utils/db_v2.js:83", "[db] adapter 类型:", this.adapter.constructor.name);
    }
    /**
     * 初始化数据库
     */
    async init() {
      try {
        formatAppLog("log", "at src/utils/db_v2.js:91", "[db] 开始初始化数据库...");
        formatAppLog("log", "at src/utils/db_v2.js:92", "[db] 调用 adapter.init()...");
        if (typeof plus === "undefined") {
          formatAppLog("warn", "at src/utils/db_v2.js:97", "[db] plus 对象未就绪，等待 plusready 事件...");
          await Promise.race([
            new Promise((resolve) => {
              const checkPlus = () => {
                if (typeof plus !== "undefined") {
                  formatAppLog("log", "at src/utils/db_v2.js:102", "[db] plus 对象已就绪");
                  resolve();
                } else {
                  setTimeout(checkPlus, 100);
                }
              };
              checkPlus();
            }),
            new Promise(
              (_2, reject) => setTimeout(() => reject(new Error("[db] plus 初始化超时（5秒）")), 5e3)
            )
          ]);
        }
        this.isH5 = typeof plus === "undefined";
        formatAppLog("log", "at src/utils/db_v2.js:118", "[db] isH5:", this.isH5);
        await this.adapter.init();
        formatAppLog("log", "at src/utils/db_v2.js:121", "[db] adapter.init() 完成");
        if (!this.isH5) {
          formatAppLog("log", "at src/utils/db_v2.js:124", "[db] 设置数据库架构...");
          await this.setupSchema();
          formatAppLog("log", "at src/utils/db_v2.js:126", "[db] 数据库架构设置完成");
        } else {
          formatAppLog("log", "at src/utils/db_v2.js:128", "[db] H5 环境，跳过架构设置");
        }
        formatAppLog("log", "at src/utils/db_v2.js:130", "[db] 数据库初始化完成");
      } catch (error) {
        formatAppLog("error", "at src/utils/db_v2.js:132", "[db] 初始化失败:", error);
        throw error;
      }
    }
    /**
     * 设置数据库架构（仅 App）
     */
    async setupSchema() {
      if (this.isH5)
        return;
      try {
        await this.adapter.execute(`CREATE TABLE IF NOT EXISTS words (
        "id" TEXT PRIMARY KEY,
        "english" TEXT NOT NULL,
        "chinese" TEXT,
        "tags" TEXT,
        "source_page" TEXT,
        "year" TEXT,
        "importance" INTEGER,
        "error_rate" REAL,
        "review_frequency" INTEGER,
        "repeat_count" INTEGER DEFAULT 1,
        "view_count" INTEGER DEFAULT 0,
        "difficulty_score" REAL DEFAULT 0.35,
        "stability" REAL DEFAULT 0.6,
        "retrievability" REAL DEFAULT 0.92,
        "interval_days" REAL DEFAULT 0,
        "lapse_count" INTEGER DEFAULT 0,
        "review_count" INTEGER DEFAULT 0,
        "next_review_time" TEXT,
        "last_reviewed_at" TEXT,
        "examples" TEXT,
        "synonyms" TEXT,
        "antonyms" TEXT,
        "create_time" TEXT,
        "update_time" TEXT,
        "is_mastered" INTEGER DEFAULT 0,
        "mastered_at" TEXT
      )`);
        await this.adapter.execute(`CREATE TABLE IF NOT EXISTS mastered_words (
        "id" TEXT PRIMARY KEY,
        "english" TEXT NOT NULL,
        "chinese" TEXT,
        "tags" TEXT,
        "source_page" TEXT,
        "year" TEXT,
        "importance" INTEGER,
        "error_rate" REAL,
        "review_frequency" INTEGER,
        "repeat_count" INTEGER DEFAULT 1,
        "view_count" INTEGER DEFAULT 0,
        "difficulty_score" REAL DEFAULT 0.35,
        "stability" REAL DEFAULT 0.6,
        "retrievability" REAL DEFAULT 0.92,
        "interval_days" REAL DEFAULT 0,
        "lapse_count" INTEGER DEFAULT 0,
        "review_count" INTEGER DEFAULT 0,
        "next_review_time" TEXT,
        "last_reviewed_at" TEXT,
        "examples" TEXT,
        "synonyms" TEXT,
        "antonyms" TEXT,
        "create_time" TEXT,
        "update_time" TEXT,
        "is_mastered" INTEGER DEFAULT 1,
        "mastered_at" TEXT,
        "wordbook_type" TEXT DEFAULT 'self'
      )`);
        const indexes = [
          "CREATE INDEX IF NOT EXISTS idx_words_importance ON words(importance)",
          "CREATE INDEX IF NOT EXISTS idx_words_english ON words(english)",
          "CREATE INDEX IF NOT EXISTS idx_words_create_time ON words(create_time)",
          "CREATE INDEX IF NOT EXISTS idx_words_next_review_time ON words(next_review_time)"
        ];
        for (const sql of indexes) {
          await this.adapter.execute(sql).catch(() => {
          });
        }
        formatAppLog("log", "at src/utils/db_v2.js:217", "[db] 数据库架构初始化完成");
      } catch (error) {
        formatAppLog("error", "at src/utils/db_v2.js:219", "[db] 设置架构失败:", error);
      }
    }
    /**
     * 获取分页单词列表
     */
    async getWordsForList(limit = 20, offset = 0, orderBy = "create_time", orderDir = "desc", filters = {}) {
      await this.init();
      if (this.isH5) {
        return this.getWordsForListH5(limit, offset, orderBy, orderDir, filters);
      }
      const safeOrderBy = { create_time: "create_time", english: "english", importance: "importance", repeat_count: "repeat_count", view_count: "view_count" }[orderBy] || "create_time";
      const safeDir = orderDir === "asc" ? "ASC" : "DESC";
      const conditions = [];
      const params = [];
      if (!filters.showMastered) {
        conditions.push("(is_mastered IS NULL OR is_mastered = 0)");
      }
      if ((filters.search || "").trim()) {
        const q2 = `%${filters.search.trim()}%`;
        conditions.push("(english LIKE ? OR chinese LIKE ?)");
        params.push(q2, q2);
      }
      if ((filters.tag || "").trim()) {
        const t2 = filters.tag.trim();
        conditions.push("(tags LIKE ? OR tags LIKE ? OR tags LIKE ? OR tags = ?)");
        params.push(`%,${t2},%`, `${t2},%`, `%,${t2}`, t2);
      }
      if (filters.year != null && filters.year !== "") {
        conditions.push("year = ?");
        params.push(String(filters.year));
      }
      if (filters.page != null && filters.page !== "") {
        conditions.push("source_page = ?");
        params.push(String(filters.page));
      }
      const where = conditions.length ? " WHERE " + conditions.join(" AND ") : "";
      const sql = `SELECT id, english, chinese, tags, source_page, year, importance, repeat_count, view_count, create_time FROM words${where} ORDER BY ${safeOrderBy} ${safeDir} LIMIT ${Math.max(0, limit)} OFFSET ${Math.max(0, offset)}`;
      try {
        return await this.adapter.query(sql, params);
      } catch (error) {
        formatAppLog("error", "at src/utils/db_v2.js:270", "[db] getWordsForList 失败:", error);
        return [];
      }
    }
    /**
     * H5 环境的分页单词列表
     */
    getWordsForListH5(limit, offset, orderBy, orderDir, filters) {
      const all = getH5Words();
      let list = all.map((w2) => ({
        id: w2.id,
        english: w2.english,
        chinese: w2.chinese,
        tags: w2.tags,
        source_page: w2.source_page,
        year: w2.year,
        importance: w2.importance,
        repeat_count: w2.repeat_count,
        view_count: w2.view_count,
        create_time: w2.create_time,
        is_mastered: w2.is_mastered
      }));
      if (!filters.showMastered) {
        list = list.filter((w2) => !w2.is_mastered);
      }
      const search = (filters.search || "").trim().toLowerCase();
      if (search) {
        list = list.filter((w2) => (w2.english || "").toLowerCase().includes(search) || (w2.chinese || "").toLowerCase().includes(search));
      }
      if (filters.tag) {
        const tag = String(filters.tag).trim();
        list = list.filter((w2) => (w2.tags || "").split(/[,，\s]+/).map((t2) => t2.trim()).includes(tag));
      }
      if (filters.year != null && filters.year !== "")
        list = list.filter((w2) => w2.year == filters.year);
      if (filters.page != null && filters.page !== "")
        list = list.filter((w2) => w2.source_page == filters.page);
      const col = { create_time: "create_time", english: "english", importance: "importance", repeat_count: "repeat_count", view_count: "view_count" }[orderBy] || "create_time";
      const mul = orderDir === "asc" ? 1 : -1;
      list.sort((a2, b2) => {
        const va = a2[col];
        const vb = b2[col];
        if (col === "create_time")
          return (new Date(va || 0) - new Date(vb || 0)) * mul;
        if (col === "english")
          return (va || "").localeCompare(vb || "") * mul;
        return ((Number(va) || 0) - (Number(vb) || 0)) * mul;
      });
      return Promise.resolve(list.slice(offset, offset + limit));
    }
    /**
     * 添加单词
     */
    async addWord(word) {
      if (!word.english)
        return Promise.reject("单词不能为空");
      await this.init();
      if (this.isH5) {
        const words = getH5Words();
        const newWord = {
          ...word,
          id: Date.now().toString(),
          create_time: (/* @__PURE__ */ new Date()).toISOString(),
          update_time: (/* @__PURE__ */ new Date()).toISOString(),
          examples: word.examples || [],
          synonyms: word.synonyms || [],
          antonyms: word.antonyms || [],
          view_count: 0
        };
        words.unshift(newWord);
        setH5Words(words);
        return Promise.resolve(newWord);
      }
      const wordId = Date.now().toString();
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const reviewFields = normalizeReviewFields(word);
      const sql = `INSERT INTO words (
      id, english, chinese, tags, source_page, year, importance, repeat_count, view_count,
      difficulty_score, stability, retrievability, interval_days, lapse_count, review_count,
      next_review_time, last_reviewed_at, examples, synonyms, antonyms, create_time, update_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [
        wordId,
        word.english,
        word.chinese || "",
        word.tags || "",
        word.source_page || "",
        word.year || "",
        word.importance || 3,
        word.repeat_count || 1,
        word.view_count != null ? word.view_count : 0,
        reviewFields.difficulty_score,
        reviewFields.stability,
        reviewFields.retrievability,
        reviewFields.interval_days,
        reviewFields.lapse_count,
        reviewFields.review_count,
        reviewFields.next_review_time,
        reviewFields.last_reviewed_at,
        toJsonString(word.examples || []),
        toJsonString(word.synonyms || []),
        toJsonString(word.antonyms || []),
        now,
        now
      ];
      try {
        await this.adapter.execute(sql, params);
        return Promise.resolve({ ...word, id: wordId });
      } catch (error) {
        formatAppLog("error", "at src/utils/db_v2.js:389", "[db] addWord 失败:", error);
        throw error;
      }
    }
    /**
     * 获取所有单词
     */
    async getWords() {
      await this.init();
      if (this.isH5) {
        const words = getH5Words().map(parseWord).sort((a2, b2) => new Date(b2.create_time || 0) - new Date(a2.create_time || 0));
        return Promise.resolve(words);
      }
      try {
        const data = await this.adapter.query("SELECT * FROM words ORDER BY create_time DESC");
        return Promise.resolve((data || []).map(parseWord));
      } catch (error) {
        formatAppLog("error", "at src/utils/db_v2.js:409", "[db] getWords 失败:", error);
        return Promise.resolve([]);
      }
    }
    /**
     * 根据 ID 获取单词
     */
    async getWordById(id) {
      if (!id)
        return Promise.resolve(null);
      await this.init();
      if (this.isH5) {
        const words = getH5Words();
        const found = words.find((w2) => w2.id === id);
        return Promise.resolve(found ? parseWord(found) : null);
      }
      try {
        const data = await this.adapter.query("SELECT * FROM words WHERE id = ?", [id]);
        return Promise.resolve(data && data.length ? parseWord(data[0]) : null);
      } catch (error) {
        formatAppLog("error", "at src/utils/db_v2.js:432", "[db] getWordById 失败:", error);
        return Promise.resolve(null);
      }
    }
    /**
     * 根据英文获取单词
     */
    async getWordByEnglish(english) {
      if (!english)
        return Promise.resolve(null);
      await this.init();
      const key = String(english).trim().toLowerCase();
      if (this.isH5) {
        const found = getH5Words().find((w2) => (w2.english || "").toLowerCase() === key);
        return Promise.resolve(found ? parseWord(found) : null);
      }
      try {
        const data = await this.adapter.query("SELECT * FROM words WHERE LOWER(english) = ? LIMIT 1", [key]);
        return Promise.resolve(data && data.length ? parseWord(data[0]) : null);
      } catch (error) {
        formatAppLog("error", "at src/utils/db_v2.js:456", "[db] getWordByEnglish 失败:", error);
        return Promise.resolve(null);
      }
    }
    /**
     * 更新单词
     */
    async updateWord(id, updates) {
      if (!id)
        return Promise.reject("无效 id");
      await this.init();
      if (this.isH5) {
        const words = getH5Words();
        const idx = words.findIndex((w2) => w2.id === id);
        if (idx === -1)
          return Promise.reject("未找到单词");
        words[idx] = {
          ...words[idx],
          ...updates,
          update_time: (/* @__PURE__ */ new Date()).toISOString()
        };
        setH5Words(words);
        return Promise.resolve();
      }
      try {
        await this.adapter.updateWord(id, updates);
        return Promise.resolve();
      } catch (error) {
        formatAppLog("error", "at src/utils/db_v2.js:487", "[db] updateWord 失败:", error);
        throw error;
      }
    }
    /**
     * 删除单词
     */
    async deleteWord(id) {
      if (!id)
        return Promise.reject("无效 id");
      await this.init();
      if (this.isH5) {
        const words = getH5Words().filter((w2) => w2.id !== id);
        setH5Words(words);
        return Promise.resolve();
      }
      try {
        await this.adapter.deleteWord(id);
        return Promise.resolve();
      } catch (error) {
        formatAppLog("error", "at src/utils/db_v2.js:510", "[db] deleteWord 失败:", error);
        throw error;
      }
    }
    /**
     * 更新错误率（带事务保护）
     */
    async updateErrorRate(id, isCorrect) {
      if (!id)
        return Promise.resolve();
      await this.init();
      if (this.isH5) {
        const words = getH5Words();
        const idx = words.findIndex((w3) => w3.id === id);
        if (idx === -1)
          return Promise.resolve();
        const w2 = words[idx];
        const er2 = w2.error_rate || 0;
        const reviewState = scheduleReviewState(w2, isCorrect);
        words[idx] = {
          ...w2,
          ...reviewState,
          error_rate: isCorrect ? Math.max(0, er2 - 8) : Math.min(100, er2 + 18),
          update_time: (/* @__PURE__ */ new Date()).toISOString()
        };
        setH5Words(words);
        return Promise.resolve();
      }
      try {
        const word = await this.getWordById(id);
        if (!word)
          return Promise.resolve();
        const currentErrorRate = word.error_rate || 0;
        const reviewState = scheduleReviewState(word, isCorrect);
        const newErrorRate = isCorrect ? Math.max(0, currentErrorRate - 8) : Math.min(100, currentErrorRate + 18);
        await this.updateWord(id, {
          error_rate: newErrorRate,
          review_frequency: reviewState.review_frequency,
          difficulty_score: reviewState.difficulty_score,
          stability: reviewState.stability,
          retrievability: reviewState.retrievability,
          interval_days: reviewState.interval_days,
          lapse_count: reviewState.lapse_count,
          review_count: reviewState.review_count,
          next_review_time: reviewState.next_review_time,
          last_reviewed_at: reviewState.last_reviewed_at
        });
        return Promise.resolve();
      } catch (error) {
        formatAppLog("error", "at src/utils/db_v2.js:565", "[db] updateErrorRate 失败:", error);
        return Promise.resolve();
      }
    }
    /**
     * 获取复习单词列表
     */
    async getReviewWords(params = {}) {
      const { sortBy = "smart", count = 20, difficulty = "normal" } = params;
      const hardMode = difficulty === "hard";
      await this.init();
      if (this.isH5) {
        let list = getH5Words().map((w2) => parseWord(w2));
        list = list.map((w2) => ({
          ...w2,
          ...calculateReviewPriority(w2, hardMode)
        }));
        if (sortBy === "error") {
          list.sort((a2, b2) => (b2.forget_probability || 0) - (a2.forget_probability || 0) || (b2.error_rate || 0) - (a2.error_rate || 0));
        } else if (sortBy === "new") {
          list.sort((a2, b2) => new Date(b2.create_time) - new Date(a2.create_time));
        } else {
          list.sort((a2, b2) => b2.score - a2.score);
        }
        return Promise.resolve(list.slice(0, count));
      }
      try {
        const data = await this.adapter.query("SELECT * FROM words");
        if (!data || data.length === 0)
          return Promise.resolve([]);
        let words = data.map((item) => {
          const priority = calculateReviewPriority(item, hardMode);
          return { ...parseWord(item), ...priority };
        });
        if (sortBy === "error") {
          words.sort((a2, b2) => (b2.forget_probability || 0) - (a2.forget_probability || 0) || (b2.error_rate || 0) - (a2.error_rate || 0));
        } else if (sortBy === "new") {
          words.sort((a2, b2) => new Date(b2.create_time) - new Date(a2.create_time));
        } else if (sortBy === "smart") {
          words.sort((a2, b2) => b2.score - a2.score);
        }
        return Promise.resolve(words.slice(0, count));
      } catch (error) {
        formatAppLog("error", "at src/utils/db_v2.js:616", "[db] getReviewWords 失败:", error);
        return Promise.resolve([]);
      }
    }
    /**
     * 获取随机干扰项
     */
    async getRandomDistractors(excludeId, count = 3) {
      await this.init();
      return this.adapter.getRandomDistractors(excludeId, count);
    }
    /**
     * 获取同标签单词
     */
    async getWordsByTag(tag, excludeId) {
      await this.init();
      return this.adapter.getWordsByTag(tag, excludeId);
    }
    /**
     * 斩掉单词
     */
    async masterWord(id) {
      if (!id)
        return Promise.reject("无效 id");
      await this.init();
      if (this.isH5) {
        const words = getH5Words();
        const idx = words.findIndex((w2) => w2.id === id);
        if (idx === -1)
          return Promise.reject("未找到单词");
        const word = words[idx];
        word.is_mastered = 1;
        word.mastered_at = (/* @__PURE__ */ new Date()).toISOString();
        words.splice(idx, 1);
        setH5Words(words);
        const masteredWords = getH5MasteredWords();
        masteredWords.push(word);
        setH5MasteredWords(masteredWords);
        return Promise.resolve();
      }
      try {
        const word = await this.getWordById(id);
        if (!word)
          return Promise.reject("未找到单词");
        await this.adapter.transaction(async () => {
          const sql = `INSERT INTO mastered_words (
          id, english, chinese, tags, source_page, year, importance, error_rate, review_frequency,
          repeat_count, view_count, difficulty_score, stability, retrievability, interval_days,
          lapse_count, review_count, next_review_time, last_reviewed_at, examples, synonyms,
          antonyms, create_time, update_time, is_mastered, mastered_at, wordbook_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          const params = [
            word.id,
            word.english,
            word.chinese,
            word.tags,
            word.source_page,
            word.year,
            word.importance,
            word.error_rate,
            word.review_frequency,
            word.repeat_count,
            word.view_count,
            word.difficulty_score,
            word.stability,
            word.retrievability,
            word.interval_days,
            word.lapse_count,
            word.review_count,
            word.next_review_time,
            word.last_reviewed_at,
            toJsonString(word.examples),
            toJsonString(word.synonyms),
            toJsonString(word.antonyms),
            word.create_time,
            (/* @__PURE__ */ new Date()).toISOString(),
            1,
            (/* @__PURE__ */ new Date()).toISOString(),
            "self"
          ];
          await this.adapter.execute(sql, params);
          await this.adapter.deleteWord(id);
        });
        return Promise.resolve();
      } catch (error) {
        formatAppLog("error", "at src/utils/db_v2.js:695", "[db] masterWord 失败:", error);
        throw error;
      }
    }
    /**
     * 获取已斩单词
     */
    async getMasteredWords() {
      await this.init();
      if (this.isH5) {
        return Promise.resolve(getH5MasteredWords().map(parseWord));
      }
      try {
        const data = await this.adapter.query("SELECT * FROM mastered_words ORDER BY mastered_at DESC");
        return Promise.resolve((data || []).map(parseWord));
      } catch (error) {
        formatAppLog("error", "at src/utils/db_v2.js:714", "[db] getMasteredWords 失败:", error);
        return Promise.resolve([]);
      }
    }
    /**
     * 获取内存使用情况（用于调试）
     */
    getMemoryStats() {
      if (typeof performance !== "undefined" && performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    }
  }
  const db = new DatabaseManager();
  const PREGEN_DB_NAME = "pregen_db";
  const PREGEN_DB_PATH = "_doc/pregen_data.db";
  const PREGEN_DB_SOURCE = "_www/static/pregen_data.db";
  let pregenDbOpen = false;
  let _ensureOpenPromise = null;
  const _pregenCache = /* @__PURE__ */ new Map();
  const PREGEN_CACHE_MAX = 300;
  function setPregenCache(key, value) {
    if (_pregenCache.size >= PREGEN_CACHE_MAX) {
      const keys = _pregenCache.keys();
      for (let i2 = 0; i2 < 30; i2++) {
        const k = keys.next().value;
        if (k !== void 0)
          _pregenCache.delete(k);
      }
    }
    _pregenCache.set(key, value);
  }
  function isApp$1() {
    return typeof plus !== "undefined" && plus.sqlite;
  }
  function copyPregenDbToDoc() {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        formatAppLog("error", "at src/utils/pregenVocab.js:38", "[pregenVocab] 复制超时");
        resolve(false);
      }, 15e3);
      const cleanup = (res) => {
        clearTimeout(timer);
        resolve(res);
      };
      if (typeof plus === "undefined" || !plus.io)
        return cleanup(false);
      plus.io.resolveLocalFileSystemURL(PREGEN_DB_SOURCE, (entry) => {
        plus.io.resolveLocalFileSystemURL("_doc/", (dir) => {
          entry.copyTo(
            dir,
            "pregen_data.db",
            () => {
              formatAppLog("log", "at src/utils/pregenVocab.js:46", "[pregenVocab] copyTo 完成");
              cleanup(true);
            },
            (err) => {
              formatAppLog("error", "at src/utils/pregenVocab.js:47", "[pregenVocab] copyTo 失败", err);
              cleanup(false);
            }
          );
        }, (e2) => {
          formatAppLog("error", "at src/utils/pregenVocab.js:49", "[pregenVocab] 解析 _doc 失败", e2);
          cleanup(false);
        });
      }, (e2) => {
        formatAppLog("error", "at src/utils/pregenVocab.js:50", "[pregenVocab] 解析源文件失败", e2);
        cleanup(false);
      });
    });
  }
  function ensureOpen() {
    if (pregenDbOpen)
      return Promise.resolve(true);
    if (_ensureOpenPromise)
      return _ensureOpenPromise;
    if (!isApp$1())
      return Promise.resolve(false);
    _ensureOpenPromise = copyPregenDbToDoc().then((copied) => {
      if (!copied)
        return false;
      return new Promise((resolve) => {
        try {
          if (plus.sqlite.isOpenDatabase({ name: PREGEN_DB_NAME, path: PREGEN_DB_PATH })) {
            pregenDbOpen = true;
            _ensureOpenPromise = null;
            return resolve(true);
          }
        } catch (_2) {
        }
        plus.sqlite.openDatabase({
          name: PREGEN_DB_NAME,
          path: PREGEN_DB_PATH,
          success: () => {
            pregenDbOpen = true;
            formatAppLog("log", "at src/utils/pregenVocab.js:75", "[pregenVocab] pregen_data.db 已打开");
            plus.sqlite.executeSql({
              name: PREGEN_DB_NAME,
              sql: "CREATE UNIQUE INDEX IF NOT EXISTS idx_english ON vocab(english)",
              success: () => {
                _ensureOpenPromise = null;
                resolve(true);
              },
              fail: () => {
                _ensureOpenPromise = null;
                resolve(true);
              }
            });
          },
          fail: (e2) => {
            formatAppLog("error", "at src/utils/pregenVocab.js:84", "[pregenVocab] openDatabase 失败", e2);
            _ensureOpenPromise = null;
            resolve(false);
          }
        });
      });
    }).catch(() => {
      _ensureOpenPromise = null;
      return false;
    });
    return _ensureOpenPromise;
  }
  function parsePregenRow(r2) {
    let examples = [], synonyms = [], antonyms = [];
    try {
      if (r2.examples)
        examples = JSON.parse(r2.examples);
    } catch (_2) {
    }
    try {
      if (r2.synonyms)
        synonyms = JSON.parse(r2.synonyms);
    } catch (_2) {
    }
    try {
      if (r2.antonyms)
        antonyms = JSON.parse(r2.antonyms);
    } catch (_2) {
    }
    return {
      chinese: (r2.chinese || "").trim(),
      examples: Array.isArray(examples) ? examples : [],
      synonyms: Array.isArray(synonyms) ? synonyms : [],
      antonyms: Array.isArray(antonyms) ? antonyms : []
    };
  }
  function sqlLiteralStr$1(value) {
    if (value === null || value === void 0)
      return "NULL";
    return `'${String(value).replace(/'/g, "''")}'`;
  }
  function getPregenWord(english) {
    if (!english || typeof english !== "string")
      return Promise.resolve(null);
    const key = english.trim().toLowerCase();
    if (!key)
      return Promise.resolve(null);
    if (!isApp$1())
      return Promise.resolve(null);
    if (_pregenCache.has(key))
      return Promise.resolve(_pregenCache.get(key));
    return ensureOpen().then((ok) => {
      if (!ok)
        return null;
      return new Promise((resolve) => {
        const sql = `SELECT * FROM vocab WHERE english = ${sqlLiteralStr$1(key)} LIMIT 1`;
        try {
          plus.sqlite.selectSql({
            name: PREGEN_DB_NAME,
            sql,
            success: (rows) => {
              try {
                if (!rows || rows.length === 0) {
                  setPregenCache(key, null);
                  resolve(null);
                  return;
                }
                const result = parsePregenRow(rows[0]);
                setPregenCache(key, result);
                resolve(result);
              } catch (err) {
                formatAppLog("error", "at src/utils/pregenVocab.js:145", "getPregenWord 解析结果异常", err);
                resolve(null);
              }
            },
            fail: (e2) => {
              formatAppLog("error", "at src/utils/pregenVocab.js:150", "pregen selectSql 失败", e2);
              resolve(null);
            }
          });
        } catch (err) {
          formatAppLog("error", "at src/utils/pregenVocab.js:155", "getPregenWord selectSql 调用异常", err);
          resolve(null);
        }
      });
    });
  }
  function getPregenWordsBatch(englishList) {
    if (!Array.isArray(englishList) || englishList.length === 0)
      return Promise.resolve({});
    const keys = [...new Set(englishList.map((w2) => (w2 || "").trim().toLowerCase()).filter(Boolean))];
    if (keys.length === 0)
      return Promise.resolve({});
    if (!isApp$1())
      return Promise.resolve({});
    return ensureOpen().then((ok) => {
      if (!ok)
        return {};
      return new Promise((resolve) => {
        const safeKeys = keys.map((k) => sqlLiteralStr$1(k));
        const inClause = safeKeys.slice(0, 500).join(",");
        const sql = `SELECT * FROM vocab WHERE english IN (${inClause})`;
        plus.sqlite.selectSql({
          name: PREGEN_DB_NAME,
          sql,
          success: (rows) => {
            const out = {};
            if (!rows || !rows.length) {
              resolve(out);
              return;
            }
            for (const r2 of rows) {
              const english = (r2.english || "").trim().toLowerCase();
              if (!english)
                continue;
              out[english] = parsePregenRow(r2);
            }
            resolve(out);
          },
          fail: () => resolve({})
        });
      });
    });
  }
  function loadPregenVocab() {
    return Promise.resolve(null);
  }
  async function getPregenVocabCache(englishList) {
    if (Array.isArray(englishList) && englishList.length > 0) {
      return getPregenWordsBatch(englishList);
    }
    return {};
  }
  const pregenVocab = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    getPregenVocabCache,
    getPregenWord,
    getPregenWordsBatch,
    loadPregenVocab
  }, Symbol.toStringTag, { value: "Module" }));
  const MASTER_DB_NAME = "master_db";
  const MASTER_DB_PATH = "_doc/vocal_master.db";
  const MASTER_DB_SOURCE = "_www/static/vocal_master.db";
  const MASTER_DB_VERSION = 4;
  const MASTER_DB_VERSION_KEY = "vocal_master_db_version";
  let masterDbOpen = false;
  let initPromise = null;
  let repairPromise = null;
  function isApp() {
    return typeof plus !== "undefined" && plus.sqlite;
  }
  function normalizeRow(r2) {
    if (!r2 || typeof r2 !== "object")
      return r2;
    const out = {};
    for (const k of Object.keys(r2))
      out[k.toLowerCase()] = r2[k];
    return out;
  }
  function checkDocDbExists() {
    return new Promise((resolve) => {
      if (typeof plus === "undefined" || !plus.io) {
        resolve(false);
        return;
      }
      plus.io.resolveLocalFileSystemURL(MASTER_DB_PATH, () => resolve(true), () => resolve(false));
    });
  }
  function getStoredDbVersion() {
    try {
      return Number(uni.getStorageSync(MASTER_DB_VERSION_KEY) || 0);
    } catch (_2) {
      return 0;
    }
  }
  function setStoredDbVersion(version) {
    try {
      uni.setStorageSync(MASTER_DB_VERSION_KEY, Number(version) || 0);
    } catch (_2) {
    }
  }
  function rawSelectSqlRows(sql) {
    return new Promise((resolve) => {
      plus.sqlite.selectSql({
        name: MASTER_DB_NAME,
        sql,
        success: (rows) => resolve(rows || []),
        fail: (e2) => {
          formatAppLog("error", "at src/utils/masterDb.js:62", "[masterDb] selectSql 失败", e2);
          resolve({ __error: e2, __rows: [] });
        }
      });
    });
  }
  function isMissingExamTableError(err) {
    const msg = String(err && (err.message || err.errMsg) || "").toLowerCase();
    return Number(err && err.code) === -1404 && (msg.includes("no such table: word_exam_stats") || msg.includes("no such table: word_exam_sentences") || msg.includes("no such table: word_exam_"));
  }
  async function validateMasterSchema() {
    if (!isApp())
      return false;
    const rows = await rawSelectSqlRows(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('vocab_master','word_exam_stats','word_exam_sentences')"
    );
    if (!Array.isArray(rows))
      return false;
    const names = rows.map((row) => String((normalizeRow(row) || {}).name || "").trim());
    return names.includes("vocab_master") && names.includes("word_exam_stats") && names.includes("word_exam_sentences");
  }
  async function repairMasterDbFromStatic() {
    if (repairPromise)
      return repairPromise;
    repairPromise = (async () => {
      formatAppLog("warn", "at src/utils/masterDb.js:92", "[masterDb] 检测到主库缺表，开始强制重建 _doc 主库副本");
      masterDbOpen = false;
      initPromise = null;
      await closeMasterDbIfOpen();
      const copied = await copyMasterDbToDoc(true);
      if (!copied) {
        formatAppLog("error", "at src/utils/masterDb.js:98", "[masterDb] 强制重拷贝主库失败");
        return false;
      }
      masterDbOpen = false;
      initPromise = null;
      const reopened = await initMasterDb();
      if (!reopened)
        return false;
      const schemaOk = await validateMasterSchema();
      if (!schemaOk) {
        formatAppLog("error", "at src/utils/masterDb.js:107", "[masterDb] 重建后仍缺少必要数据表");
        return false;
      }
      formatAppLog("log", "at src/utils/masterDb.js:110", "[masterDb] 主库缺表自愈完成");
      return true;
    })().finally(() => {
      repairPromise = null;
    });
    return repairPromise;
  }
  function closeMasterDbIfOpen() {
    return new Promise((resolve) => {
      try {
        const isOpen = plus.sqlite.isOpenDatabase({
          name: MASTER_DB_NAME,
          path: MASTER_DB_PATH
        });
        if (!isOpen) {
          masterDbOpen = false;
          resolve(true);
          return;
        }
        plus.sqlite.closeDatabase({
          name: MASTER_DB_NAME,
          success: () => {
            masterDbOpen = false;
            resolve(true);
          },
          fail: () => {
            masterDbOpen = false;
            resolve(false);
          }
        });
      } catch (_2) {
        masterDbOpen = false;
        resolve(false);
      }
    });
  }
  function removeDocDbFile() {
    return new Promise((resolve) => {
      if (typeof plus === "undefined" || !plus.io) {
        resolve(false);
        return;
      }
      plus.io.resolveLocalFileSystemURL(
        MASTER_DB_PATH,
        (entry) => {
          entry.remove(() => resolve(true), () => resolve(false));
        },
        () => resolve(true)
      );
    });
  }
  function copyMasterDbToDoc(forceReplace = false) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        formatAppLog("error", "at src/utils/masterDb.js:168", "[masterDb] 复制操作超时，强制退出");
        resolve(false);
      }, 15e3);
      const cleanup = (res) => {
        clearTimeout(timer);
        resolve(res);
      };
      if (typeof plus === "undefined" || !plus.io)
        return cleanup(false);
      formatAppLog("log", "at src/utils/masterDb.js:179", "[masterDb] 准备从:", MASTER_DB_SOURCE);
      const doCopy = () => {
        plus.io.resolveLocalFileSystemURL(MASTER_DB_SOURCE, (entry) => {
          plus.io.resolveLocalFileSystemURL("_doc/", (dir) => {
            entry.copyTo(dir, "vocal_master.db", () => {
              formatAppLog("log", "at src/utils/masterDb.js:184", "[masterDb] 原生 copyTo 物理完成！");
              cleanup(true);
            }, (err) => {
              formatAppLog("error", "at src/utils/masterDb.js:187", "[masterDb] copyTo 失败:", err);
              cleanup(false);
            });
          }, (e2) => {
            formatAppLog("error", "at src/utils/masterDb.js:191", "[masterDb] 解析 _doc 失败", e2);
            cleanup(false);
          });
        }, (e2) => {
          formatAppLog("error", "at src/utils/masterDb.js:195", "[masterDb] 解析源文件失败，请确认 MASTER_DB_SOURCE 路径正确:", e2);
          cleanup(false);
        });
      };
      if (!forceReplace) {
        doCopy();
        return;
      }
      closeMasterDbIfOpen().then(() => removeDocDbFile()).then(() => doCopy()).catch(() => cleanup(false));
    });
  }
  function initMasterDb() {
    if (masterDbOpen) {
      formatAppLog("log", "at src/utils/masterDb.js:217", "[masterDb] 主库已打开，直接返回");
      return Promise.resolve(true);
    }
    if (initPromise) {
      formatAppLog("log", "at src/utils/masterDb.js:221", "[masterDb] 初始化进行中，等待同一 Promise（避免重复复制）");
      return initPromise;
    }
    if (!isApp())
      return Promise.resolve(false);
    formatAppLog("log", "at src/utils/masterDb.js:226", "[masterDb] 首次初始化：复制并打开主库（仅此一次）");
    const initWork = checkDocDbExists().then((exists) => {
      const shouldForceReplace = getStoredDbVersion() !== MASTER_DB_VERSION;
      if (exists) {
        if (!shouldForceReplace) {
          formatAppLog("log", "at src/utils/masterDb.js:231", "[masterDb] _doc 下已存在 vocal_master.db 且版本匹配，跳过复制");
          return true;
        }
        formatAppLog("log", "at src/utils/masterDb.js:234", "[masterDb] 检测到主库版本变更，开始刷新 _doc/vocal_master.db");
        return copyMasterDbToDoc(true).then((copied) => {
          if (copied)
            formatAppLog("log", "at src/utils/masterDb.js:236", "[masterDb] 主库刷新完成");
          else
            formatAppLog("warn", "at src/utils/masterDb.js:237", "[masterDb] 主库刷新失败");
          return copied;
        });
      }
      formatAppLog("log", "at src/utils/masterDb.js:241", "[masterDb] 目标文件不存在，开始从 static 复制 22MB...");
      return copyMasterDbToDoc().then((copied) => {
        if (copied)
          formatAppLog("log", "at src/utils/masterDb.js:243", "[masterDb] 复制完成");
        else
          formatAppLog("warn", "at src/utils/masterDb.js:244", "[masterDb] 复制未成功");
        return copied;
      });
    }).then((ready) => {
      if (!ready)
        return false;
      return new Promise((resolve) => {
        const isOpen = plus.sqlite.isOpenDatabase({
          name: MASTER_DB_NAME,
          path: MASTER_DB_PATH
        });
        if (isOpen) {
          formatAppLog("log", "at src/utils/masterDb.js:255", "[masterDb] 检测到数据库已在打开状态，直接进入查询阶段");
          masterDbOpen = true;
          return resolve(true);
        }
        plus.sqlite.openDatabase({
          name: MASTER_DB_NAME,
          path: MASTER_DB_PATH,
          success: async () => {
            masterDbOpen = true;
            formatAppLog("log", "at src/utils/masterDb.js:265", "[masterDb] 数据库真正打开成功！name=", MASTER_DB_NAME, "path=", MASTER_DB_PATH);
            formatAppLog("log", "at src/utils/masterDb.js:266", "[masterDb] 库已就绪，开始执行挂起的查询");
            plus.sqlite.executeSql({
              name: MASTER_DB_NAME,
              sql: "CREATE UNIQUE INDEX IF NOT EXISTS idx_word ON vocab_master(english)",
              success: async () => {
                formatAppLog("log", "at src/utils/masterDb.js:271", "[masterDb] idx_word 索引已确保");
                setStoredDbVersion(MASTER_DB_VERSION);
                const schemaOk = await validateMasterSchema();
                if (!schemaOk) {
                  const repaired = await repairMasterDbFromStatic();
                  resolve(repaired);
                  return;
                }
                resolve(true);
              },
              fail: async (e2) => {
                formatAppLog("warn", "at src/utils/masterDb.js:282", "[masterDb] 创建索引失败(可忽略)", e2);
                setStoredDbVersion(MASTER_DB_VERSION);
                const schemaOk = await validateMasterSchema();
                if (!schemaOk) {
                  const repaired = await repairMasterDbFromStatic();
                  resolve(repaired);
                  return;
                }
                resolve(true);
              }
            });
          },
          fail: (e2) => {
            const code = e2 && e2.code;
            const msg = e2 && (e2.message || e2.errMsg) || "";
            if (code === -1402 || typeof msg === "string" && msg.includes("Already Open")) {
              formatAppLog("log", "at src/utils/masterDb.js:298", "[masterDb] 忽略 -1402 错误（库已打开），继续执行");
              masterDbOpen = true;
              setStoredDbVersion(MASTER_DB_VERSION);
              return resolve(true);
            }
            formatAppLog("error", "at src/utils/masterDb.js:303", "[masterDb] openDatabase 失败", e2);
            initPromise = null;
            if (typeof uni !== "undefined" && uni.showModal) {
              uni.showModal({ title: "主库打开失败", content: msg || JSON.stringify(e2), showCancel: false });
            }
            resolve(false);
          }
        });
      });
    }).catch((e2) => {
      formatAppLog("error", "at src/utils/masterDb.js:313", "[masterDb] initMasterDb 异常", e2);
      initPromise = null;
      return false;
    });
    const timeoutMs = 3e4;
    const timeoutPromise = new Promise((_2, reject) => {
      setTimeout(() => {
        if (!masterDbOpen) {
          formatAppLog("error", "at src/utils/masterDb.js:322", "[masterDb] 初始化超时", timeoutMs, "ms");
          initPromise = null;
          if (typeof uni !== "undefined" && uni.showModal) {
            uni.showModal({
              title: "主库初始化超时",
              content: timeoutMs / 1e3 + " 秒内未完成复制或打开，请检查 static 下是否有 vocal_master.db，或稍后重试。",
              showCancel: false
            });
          }
          reject(new Error("主库初始化超时"));
        }
      }, timeoutMs);
    });
    initPromise = Promise.race([initWork, timeoutPromise]).then((v2) => v2, () => false);
    return initPromise;
  }
  function ensureMasterOpen() {
    return initMasterDb();
  }
  function safeSqlValue(value) {
    if (value === null || value === void 0)
      return "";
    if (typeof value === "number")
      return Number.isFinite(value) ? String(value) : "";
    if (typeof value === "boolean")
      return value ? "1" : "0";
    return String(value).replace(/'/g, "''");
  }
  function sqlLiteralStr(value) {
    if (value === null || value === void 0)
      return "NULL";
    return `'${safeSqlValue(String(value))}'`;
  }
  function selectSqlRows(sql) {
    return rawSelectSqlRows(sql).then(async (result) => {
      if (Array.isArray(result))
        return result;
      const err = result && result.__error;
      if (isMissingExamTableError(err)) {
        const repaired = await repairMasterDbFromStatic();
        if (repaired) {
          const retry = await rawSelectSqlRows(sql);
          return Array.isArray(retry) ? retry : [];
        }
      }
      return [];
    });
  }
  function parseJsonSafe(raw, fallback) {
    try {
      const data = typeof raw === "string" ? JSON.parse(raw || "") : raw;
      return data == null ? fallback : data;
    } catch (_2) {
      return fallback;
    }
  }
  function normalizeDefType(rawType) {
    const value = String(rawType || "").trim().toLowerCase();
    if (!value)
      return "normal";
    if ([
      "freq",
      "important",
      "important_meaning",
      "importantmeaning",
      "重点",
      "重点义",
      "重要",
      "重要义",
      "重要意思",
      "常考",
      "高频"
    ].includes(value)) {
      return "freq";
    }
    if ([
      "rare",
      "rare_meaning",
      "raremeaning",
      "僻义",
      "熟词僻义",
      "熟词生义",
      "生义"
    ].includes(value)) {
      return "rare";
    }
    return "normal";
  }
  function normalizeDefs(defs) {
    if (!Array.isArray(defs))
      return [];
    return defs.map((item) => {
      if (!item || typeof item !== "object")
        return null;
      const pos = String(item.pos || "").trim();
      const trans = String(item.trans || "").trim();
      if (!trans)
        return null;
      return {
        ...item,
        pos,
        trans,
        type: normalizeDefType(item.type)
      };
    }).filter(Boolean);
  }
  function buildChineseFromDefs(defs, fallback = "") {
    if (!Array.isArray(defs) || defs.length === 0)
      return fallback || "";
    const parts = [];
    for (const d2 of defs) {
      if (!d2 || typeof d2 !== "object")
        continue;
      const pos = String(d2.pos || "").trim();
      const trans = String(d2.trans || "").trim();
      if (!trans)
        continue;
      parts.push(pos ? `${pos} ${trans}` : trans);
      if (parts.length >= 4)
        break;
    }
    return parts.length ? parts.join("；") : fallback || "";
  }
  function parseCoreRow(row) {
    const nr = normalizeRow(row || {});
    const data = parseJsonSafe(nr.data_json, {}) || {};
    const defs = normalizeDefs(data.defs);
    return {
      english: (nr.english || "").trim().toLowerCase(),
      chinese: buildChineseFromDefs(defs, (nr.chinese || "").trim()),
      examples: Array.isArray(data.examples) ? data.examples : [],
      synonyms: Array.isArray(data.synonyms) ? data.synonyms : [],
      antonyms: Array.isArray(data.antonyms) ? data.antonyms : [],
      defs,
      exam_tip: typeof data.exam_tip === "string" ? data.exam_tip : "",
      sentiment: data.sentiment === "pos" || data.sentiment === "neg" || data.sentiment === "neu" ? data.sentiment : "neu",
      data_json: {
        ...data,
        defs
      }
    };
  }
  function parseExamStatsRow(row) {
    if (!row)
      return null;
    const nr = normalizeRow(row);
    const years = parseJsonSafe(nr.years_json, []);
    const byYear = parseJsonSafe(nr.by_year_json, {});
    const bySection = parseJsonSafe(nr.by_section_json, {});
    const positions = parseJsonSafe(nr.positions_json, []);
    const tags = parseJsonSafe(nr.tags_json, []);
    return {
      total_count: Number(nr.total_count) || 0,
      years: Array.isArray(years) ? years : [],
      by_year: byYear && typeof byYear === "object" ? byYear : {},
      by_section: bySection && typeof bySection === "object" ? bySection : {},
      positions: Array.isArray(positions) ? positions : [],
      importance: nr.importance != null ? Number(nr.importance) || 0 : 0,
      tags: Array.isArray(tags) ? tags : []
    };
  }
  function parseExamSentenceRows(rows) {
    if (!Array.isArray(rows) || rows.length === 0)
      return [];
    return rows.map((row) => {
      const nr = normalizeRow(row);
      return {
        year: nr.year || "",
        section: nr.section || "",
        exam_type: nr.exam_type || "",
        sentence: nr.sentence || ""
      };
    }).filter((item) => (item.sentence || "").trim());
  }
  async function getWordFullDetail(word) {
    if (!word || typeof word !== "string")
      return null;
    const english = word.trim().toLowerCase();
    if (!english)
      return null;
    if (!isApp())
      return null;
    if (wordDetailCache.has(english))
      return wordDetailCache.get(english);
    formatAppLog("log", "at src/utils/masterDb.js:516", "[masterDb] 收到查询请求:", english);
    try {
      await initMasterDb();
      const isOpen = plus.sqlite.isOpenDatabase && plus.sqlite.isOpenDatabase({ name: MASTER_DB_NAME, path: MASTER_DB_PATH });
      if (!isOpen) {
        formatAppLog("error", "at src/utils/masterDb.js:521", "[masterDb] 主库未打开");
        return null;
      }
      const safe = sqlLiteralStr(english);
      const [coreRows, statsRows, sentenceRows] = await Promise.all([
        selectSqlRows(`SELECT english, chinese, data_json FROM vocab_master WHERE english = ${safe} LIMIT 1`),
        selectSqlRows(`SELECT * FROM word_exam_stats WHERE english = ${safe} LIMIT 1`),
        selectSqlRows(`SELECT year, section, exam_type, sentence FROM word_exam_sentences WHERE english = ${safe} ORDER BY year, id`)
      ]);
      formatAppLog("log", "at src/utils/masterDb.js:530", "[masterDb] 查询结果返回！core=", coreRows.length, "stats=", statsRows.length, "sentences=", sentenceRows.length);
      if ((!coreRows || coreRows.length === 0) && (!statsRows || statsRows.length === 0) && (!sentenceRows || sentenceRows.length === 0)) {
        return null;
      }
      const core = coreRows && coreRows.length ? parseCoreRow(coreRows[0]) : parseCoreRow({ english, chinese: "", data_json: "{}" });
      const result = {
        chinese: core.chinese,
        examples: core.examples,
        synonyms: core.synonyms,
        antonyms: core.antonyms,
        examStats: statsRows && statsRows.length ? parseExamStatsRow(statsRows[0]) : null,
        examSentences: parseExamSentenceRows(sentenceRows),
        defs: core.defs,
        exam_tip: core.exam_tip,
        sentiment: core.sentiment,
        data_json: core.data_json
      };
      setDetailCache(english, result);
      return result;
    } catch (err) {
      formatAppLog("error", "at src/utils/masterDb.js:550", "[masterDb] 流程中断:", err);
      return null;
    }
  }
  async function getWordExamData(word) {
    if (!word || typeof word !== "string")
      return { examStats: null, examSentences: [] };
    const english = word.trim().toLowerCase();
    if (!english || !isApp())
      return { examStats: null, examSentences: [] };
    try {
      await initMasterDb();
      const isOpen = plus.sqlite.isOpenDatabase && plus.sqlite.isOpenDatabase({ name: MASTER_DB_NAME, path: MASTER_DB_PATH });
      if (!isOpen)
        return { examStats: null, examSentences: [] };
      const safe = sqlLiteralStr(english);
      const [statsRows, sentenceRows] = await Promise.all([
        selectSqlRows(`SELECT * FROM word_exam_stats WHERE english = ${safe} LIMIT 1`),
        selectSqlRows(`SELECT year, section, exam_type, sentence FROM word_exam_sentences WHERE english = ${safe} ORDER BY year, id`)
      ]);
      return {
        examStats: statsRows && statsRows.length ? parseExamStatsRow(statsRows[0]) : null,
        examSentences: parseExamSentenceRows(sentenceRows)
      };
    } catch (err) {
      formatAppLog("error", "at src/utils/masterDb.js:573", "[masterDb] getWordExamData 失败", err);
      return { examStats: null, examSentences: [] };
    }
  }
  async function getWordExamStatsBatch(englishList) {
    if (!Array.isArray(englishList) || englishList.length === 0 || !isApp())
      return {};
    const keys = [...new Set(englishList.map((w2) => (typeof w2 === "string" ? w2 : w2 && w2.english || "").trim().toLowerCase()).filter(Boolean))];
    if (keys.length === 0)
      return {};
    try {
      const ok = await ensureMasterOpen();
      if (!ok)
        return {};
      const safeKeys = keys.slice(0, 500).map((k) => sqlLiteralStr(k));
      const rows = await selectSqlRows(
        `SELECT english, total_count, importance, tags_json FROM word_exam_stats WHERE english IN (${safeKeys.join(",")})`
      );
      const out = {};
      for (const row of rows) {
        const nr = normalizeRow(row);
        const english = (nr.english || "").trim().toLowerCase();
        if (!english)
          continue;
        const tags = parseJsonSafe(nr.tags_json, []);
        out[english] = {
          examCount: Number(nr.total_count) || 0,
          importance: nr.importance != null ? Number(nr.importance) || 0 : 0,
          tags: Array.isArray(tags) ? tags.join(",") : ""
        };
      }
      return out;
    } catch (err) {
      formatAppLog("error", "at src/utils/masterDb.js:603", "[masterDb] getWordExamStatsBatch 失败", err);
      return {};
    }
  }
  function getWordBriefBatch(englishList) {
    if (!Array.isArray(englishList) || englishList.length === 0)
      return Promise.resolve({});
    const keys = [...new Set(englishList.map((w2) => (typeof w2 === "string" ? w2 : w2 && w2.english || "").trim().toLowerCase()).filter(Boolean))];
    if (keys.length === 0)
      return Promise.resolve({});
    if (!isApp())
      return Promise.resolve({});
    return ensureMasterOpen().then((ok) => {
      if (!ok)
        return {};
      return new Promise((resolve) => {
        try {
          const safeKeys = keys.slice(0, 500).map((k) => sqlLiteralStr(k));
          const sql = `
          SELECT
            v.english,
            v.chinese,
            v.data_json,
            s.total_count,
            s.importance,
            s.tags_json
          FROM vocab_master v
          LEFT JOIN word_exam_stats s ON v.english = s.english
          WHERE v.english IN (${safeKeys.join(",")})
        `;
          plus.sqlite.selectSql({
            name: MASTER_DB_NAME,
            sql,
            success: (rows) => {
              const out = {};
              if (rows && rows.length) {
                for (const r2 of rows) {
                  const nr = normalizeRow(r2);
                  const en2 = (nr.english || "").trim().toLowerCase();
                  if (!en2)
                    continue;
                  const core = parseCoreRow(nr);
                  const tags = parseJsonSafe(nr.tags_json, []);
                  out[en2] = {
                    chinese: core.chinese,
                    examCount: Number(nr.total_count) || 0,
                    tags: Array.isArray(tags) ? tags.join(",") : "",
                    importance: nr.importance != null ? Number(nr.importance) || 0 : 0
                  };
                }
              }
              formatAppLog("log", "at src/utils/masterDb.js:654", "[masterDb] getWordBriefBatch 成功, 条数=", rows ? rows.length : 0);
              resolve(out);
            },
            fail: (e2) => {
              formatAppLog("error", "at src/utils/masterDb.js:658", "[masterDb] getWordBriefBatch selectSql 失败", e2);
              resolve({});
            }
          });
        } catch (e2) {
          resolve({});
        }
      });
    });
  }
  let reviewWordListCache = null;
  const wordDetailCache = /* @__PURE__ */ new Map();
  const DETAIL_CACHE_MAX = 200;
  function setDetailCache(key, value) {
    if (wordDetailCache.size >= DETAIL_CACHE_MAX) {
      const keys = wordDetailCache.keys();
      for (let i2 = 0; i2 < 20; i2++) {
        const k = keys.next().value;
        if (k !== void 0)
          wordDetailCache.delete(k);
      }
    }
    wordDetailCache.set(key, value);
  }
  function getWordListForReview() {
    if (reviewWordListCache && reviewWordListCache.length > 0)
      return Promise.resolve(reviewWordListCache);
    if (!isApp())
      return Promise.resolve([]);
    return ensureMasterOpen().then((ok) => {
      if (!ok)
        return [];
      return new Promise((resolve) => {
        plus.sqlite.selectSql({
          name: MASTER_DB_NAME,
          sql: "SELECT english, chinese FROM vocab_master LIMIT 5000",
          success: (rows) => {
            const list = [];
            if (rows && rows.length) {
              for (const r2 of rows) {
                const w2 = (r2.english || "").trim();
                if (w2)
                  list.push({ word: w2, chinese: (r2.chinese || "").trim() });
              }
            }
            reviewWordListCache = list;
            resolve(list);
          },
          fail: () => resolve([])
        });
      });
    });
  }
  const masterDb = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    ensureMasterOpen,
    getWordBriefBatch,
    getWordExamData,
    getWordExamStatsBatch,
    getWordFullDetail,
    getWordListForReview
  }, Symbol.toStringTag, { value: "Module" }));
  const STORAGE_KEY = "currentWordbook";
  const CLOUD_LIST_KEY = "cloudWordbooks";
  const SELF_ID = "self";
  const GUEST_DEFAULT_BOOK = "红宝书";
  const LOGIN_DEFAULT_BOOK = SELF_ID;
  const LOCAL_KEYS = ["红宝书", "红宝书补全版", "真题高频词", "真题所有词"];
  function getCloudWordbooks() {
    try {
      const raw = uni.getStorageSync(CLOUD_LIST_KEY);
      const list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list))
        return [{ id: SELF_ID, name: "自用单词" }];
      const hasSelf = list.some((o2) => o2.id === SELF_ID);
      if (!hasSelf)
        return [{ id: SELF_ID, name: "自用单词" }, ...list];
      return list;
    } catch (_2) {
      return [{ id: SELF_ID, name: "自用单词" }];
    }
  }
  function setCloudWordbooks(list) {
    uni.setStorageSync(CLOUD_LIST_KEY, JSON.stringify(list));
  }
  function addCloudWordbook(name) {
    const id = "wb_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
    const list = getCloudWordbooks().filter((o2) => o2.id !== SELF_ID);
    list.push({ id, name: (name || "").trim() || "未命名" });
    setCloudWordbooks([{ id: SELF_ID, name: "自用单词" }, ...list]);
    return id;
  }
  function removeCloudWordbook(id) {
    if (id === SELF_ID)
      return;
    const list = getCloudWordbooks().filter((o2) => o2.id !== id);
    setCloudWordbooks(list);
    try {
      uni.removeStorageSync("wordbook_words_" + id);
    } catch (_2) {
    }
  }
  function isLoggedIn() {
    try {
      return !!uni.getStorageSync("uid");
    } catch (_2) {
      return false;
    }
  }
  function getDefaultWordbook() {
    return isLoggedIn() ? LOGIN_DEFAULT_BOOK : GUEST_DEFAULT_BOOK;
  }
  function getCurrentWordbook() {
    try {
      let v2 = uni.getStorageSync(STORAGE_KEY);
      if (v2 === "自用单词")
        v2 = SELF_ID;
      if (LOCAL_KEYS.includes(v2))
        return v2;
      if (v2 === SELF_ID)
        return isLoggedIn() ? SELF_ID : GUEST_DEFAULT_BOOK;
      const list = getCloudWordbooks();
      if (list.some((o2) => o2.id === v2))
        return isLoggedIn() ? v2 : GUEST_DEFAULT_BOOK;
      return getDefaultWordbook();
    } catch (_2) {
      return getDefaultWordbook();
    }
  }
  function setCurrentWordbook(idOrKey) {
    uni.setStorageSync(STORAGE_KEY, idOrKey);
  }
  function isSelfWordbook() {
    return getCurrentWordbook() === SELF_ID;
  }
  function isLocalWordbookKey(key) {
    return LOCAL_KEYS.includes(key);
  }
  function getWordbookListForUI() {
    const cloud = getCloudWordbooks();
    const local = LOCAL_KEYS.map((key) => ({ id: key, name: key, isLocal: true, canDelete: false }));
    return [
      ...cloud.map((o2) => ({ ...o2, isLocal: false, canDelete: o2.id !== SELF_ID })),
      ...local
    ];
  }
  const WORDS_PREFIX = "wordbook_words_";
  function getWordbookWords(id) {
    if (!id || id === SELF_ID)
      return [];
    try {
      const raw = uni.getStorageSync(WORDS_PREFIX + id);
      return raw ? JSON.parse(raw) : [];
    } catch (_2) {
      return [];
    }
  }
  function setWordbookWords(id, words) {
    if (!id || id === SELF_ID)
      return;
    uni.setStorageSync(WORDS_PREFIX + id, JSON.stringify(words || []));
  }
  function parseCsvToWordList(text) {
    if (!text || typeof text !== "string")
      return [];
    const lines = text.trim().split(/\r?\n/);
    const out = [];
    for (let i2 = 1; i2 < lines.length; i2++) {
      const line = lines[i2];
      const parts = line.split(",");
      if (parts.length >= 1 && parts[0].trim()) {
        out.push({
          english: parts[0].trim(),
          exam_count: parseInt(parts[1], 10) || 0,
          importance: parseInt(parts[2], 10) || 0
        });
      }
    }
    return out;
  }
  function loadCsvByPlusIo(fileName) {
    return new Promise((resolve) => {
      if (typeof plus === "undefined" || !plus.io) {
        resolve(null);
        return;
      }
      const paths = ["_www/static/wordbooks/" + fileName, "static/wordbooks/" + fileName];
      let tried = 0;
      const tryNext = () => {
        if (tried >= paths.length) {
          resolve(null);
          return;
        }
        const path = paths[tried++];
        plus.io.resolveLocalFileSystemURL(path, (entry) => {
          entry.file((file) => {
            const reader = new plus.io.FileReader();
            reader.onloadend = (e2) => {
              var _a;
              return resolve(((_a = e2.target) == null ? void 0 : _a.result) ?? null);
            };
            reader.onerror = () => resolve(null);
            reader.readAsText(file, "utf-8");
          }, () => tryNext());
        }, () => tryNext());
      };
      tryNext();
    });
  }
  function loadLocalWordbook(key) {
    const fileName = key + ".csv";
    return new Promise((resolve) => {
      const onText = (text) => {
        if (text != null && typeof text !== "string")
          text = String(text);
        const list = parseCsvToWordList(text);
        if (list.length === 0 && text != null) {
          formatAppLog("warn", "at src/utils/wordbookSource.js:174", "[wordbookSource] CSV 解析后为空，key=", key, "textLen=", (text || "").length);
        }
        resolve(list);
      };
      if (typeof plus !== "undefined" && plus.io) {
        loadCsvByPlusIo(fileName).then((text) => {
          if (text != null)
            return onText(text);
          try {
            const fileUrl = plus.io.convertLocalFileSystemURL("_www/static/wordbooks/" + fileName);
            if (fileUrl) {
              uni.request({
                url: fileUrl,
                method: "GET",
                dataType: "text",
                success: (res) => {
                  if (res.statusCode === 200)
                    onText(res.data);
                  else
                    onText(null);
                },
                fail: () => onText(null)
              });
              return;
            }
          } catch (_2) {
          }
          onText(null);
        });
        return;
      }
      uni.request({
        url: "/static/wordbooks/" + encodeURIComponent(fileName),
        method: "GET",
        dataType: "text",
        success: (res) => {
          if (res.statusCode === 200)
            onText(res.data);
          else
            onText(null);
        },
        fail: () => onText(null)
      });
    });
  }
  const PROFILE_KEY = "learning_center_profiles_v1";
  const MISTAKE_KEY = "learning_center_mistakes_v1";
  const HISTORY_KEY = "learning_center_history_v1";
  const EXTRA_KEY = "learning_center_extra_v1";
  const safeRead = (key, fallback) => {
    try {
      const raw = uni.getStorageSync(key);
      if (!raw)
        return fallback;
      if (typeof raw === "string") {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : fallback;
      }
      return raw && typeof raw === "object" ? raw : fallback;
    } catch (_2) {
      return fallback;
    }
  };
  const safeWrite = (key, value) => {
    try {
      uni.setStorageSync(key, JSON.stringify(value));
    } catch (_2) {
    }
  };
  const normalizeWordKey = (word) => {
    if (!word)
      return "";
    if (typeof word === "string")
      return word.trim().toLowerCase();
    return String(word.english || "").trim().toLowerCase();
  };
  const normalizeProfile = (profile = {}) => {
    const key = normalizeWordKey(profile.english || profile.key || "");
    const bookIds = Array.isArray(profile.bookIds) ? [...new Set(profile.bookIds.filter(Boolean))] : [];
    const normalized = {
      key,
      english: String(profile.english || key || "").trim(),
      chinese: String(profile.chinese || "").trim(),
      importance: Number(profile.importance || 0) || 0,
      mastery: Number(profile.mastery || 0) || 0,
      seen_count: Math.max(0, Number(profile.seen_count || 0)),
      correct_count: Math.max(0, Number(profile.correct_count || 0)),
      wrong_count: Math.max(0, Number(profile.wrong_count || 0)),
      consecutive_correct: Math.max(0, Number(profile.consecutive_correct || 0)),
      first_learned_at: profile.first_learned_at || "",
      first_day_stage: Math.max(0, Number(profile.first_day_stage || 0)),
      first_day_due_at: profile.first_day_due_at || "",
      bookIds,
      last_book_id: profile.last_book_id || "",
      source: profile.source || "",
      created_at: profile.created_at || "",
      updated_at: profile.updated_at || "",
      ...normalizeReviewFields(profile)
    };
    normalized.mastery = normalized.mastery || calculateMastery(normalized);
    return normalized;
  };
  let _profilesCache = null;
  let _mistakesCache = null;
  const getProfilesMap = () => {
    if (_profilesCache)
      return _profilesCache;
    _profilesCache = safeRead(PROFILE_KEY, {});
    return _profilesCache;
  };
  const setProfilesMap = (map) => {
    _profilesCache = map || {};
    safeWrite(PROFILE_KEY, _profilesCache);
  };
  const getMistakesMap = () => {
    if (_mistakesCache)
      return _mistakesCache;
    _mistakesCache = safeRead(MISTAKE_KEY, {});
    return _mistakesCache;
  };
  const setMistakesMap = (map) => {
    _mistakesCache = map || {};
    safeWrite(MISTAKE_KEY, _mistakesCache);
  };
  const getHistoryList = () => {
    const list = safeRead(HISTORY_KEY, []);
    return Array.isArray(list) ? list : [];
  };
  const setHistoryList = (list) => safeWrite(HISTORY_KEY, Array.isArray(list) ? list.slice(-400) : []);
  const getExtraMap = () => safeRead(EXTRA_KEY, {});
  const setExtraMap = (map) => safeWrite(EXTRA_KEY, map || {});
  const getFirstDayNextDue = (profile, isCorrect, now = /* @__PURE__ */ new Date()) => {
    const stage = Math.max(0, Number(profile.first_day_stage || 0));
    if (!profile.first_learned_at) {
      return {
        first_day_stage: 1,
        first_day_due_at: new Date(now.getTime() + 10 * 60 * 1e3).toISOString(),
        first_learned_at: now.toISOString()
      };
    }
    if (!isCorrect) {
      return {
        first_day_stage: stage || 1,
        first_day_due_at: new Date(now.getTime() + 20 * 60 * 1e3).toISOString(),
        first_learned_at: profile.first_learned_at
      };
    }
    if (stage <= 1) {
      return {
        first_day_stage: 2,
        first_day_due_at: new Date(now.getTime() + 6 * 60 * 60 * 1e3).toISOString(),
        first_learned_at: profile.first_learned_at
      };
    }
    if (stage === 2) {
      return {
        first_day_stage: 3,
        first_day_due_at: new Date(now.getTime() + 24 * 60 * 60 * 1e3).toISOString(),
        first_learned_at: profile.first_learned_at
      };
    }
    return {
      first_day_stage: 4,
      first_day_due_at: "",
      first_learned_at: profile.first_learned_at
    };
  };
  const getWordProfile = (word) => {
    const key = normalizeWordKey(word);
    if (!key)
      return null;
    const map = getProfilesMap();
    return map[key] ? normalizeProfile(map[key]) : null;
  };
  const saveWordProfile = (word, patch = {}) => {
    const key = normalizeWordKey(word);
    if (!key)
      return null;
    const profiles = getProfilesMap();
    const prev = normalizeProfile(profiles[key] || { key, english: typeof word === "string" ? word : word.english });
    const next = normalizeProfile({
      ...prev,
      ...typeof word === "object" ? word : {},
      ...patch,
      key,
      english: typeof word === "string" ? word : word.english || prev.english,
      updated_at: (/* @__PURE__ */ new Date()).toISOString(),
      created_at: prev.created_at || (/* @__PURE__ */ new Date()).toISOString()
    });
    profiles[key] = next;
    setProfilesMap(profiles);
    return next;
  };
  const recordReviewOutcome = (word, isCorrect, options = {}) => {
    const key = normalizeWordKey(word);
    if (!key)
      return null;
    const now = /* @__PURE__ */ new Date();
    const bookId = options.bookId || getCurrentWordbook() || "self";
    const prev = getWordProfile(word) || normalizeProfile({
      ...typeof word === "object" ? word : {},
      english: typeof word === "string" ? word : word.english,
      chinese: typeof word === "object" ? word.chinese : "",
      importance: typeof word === "object" ? word.importance : 0,
      created_at: now.toISOString()
    });
    const reviewState = scheduleReviewState({ ...prev, ...typeof word === "object" ? word : {} }, isCorrect, now);
    const firstDayState = getFirstDayNextDue(prev, isCorrect, now);
    const next = saveWordProfile(word, {
      ...reviewState,
      mastery: calculateMastery({ ...prev, ...reviewState }),
      seen_count: prev.seen_count + 1,
      correct_count: prev.correct_count + (isCorrect ? 1 : 0),
      wrong_count: prev.wrong_count + (isCorrect ? 0 : 1),
      consecutive_correct: isCorrect ? prev.consecutive_correct + 1 : 0,
      chinese: typeof word === "object" && word.chinese ? word.chinese : prev.chinese,
      importance: typeof word === "object" && word.importance != null ? Number(word.importance) || 0 : prev.importance,
      bookIds: [.../* @__PURE__ */ new Set([...prev.bookIds || [], bookId])],
      last_book_id: bookId,
      source: options.source || "review",
      first_learned_at: firstDayState.first_learned_at,
      first_day_stage: firstDayState.first_day_stage,
      first_day_due_at: firstDayState.first_day_due_at
    });
    const mistakes = getMistakesMap();
    const oldMistake = mistakes[key] || {
      key,
      english: next.english,
      chinese: next.chinese,
      error_count: 0,
      recover_count: 0,
      active: false,
      bookIds: [],
      last_wrong_at: ""
    };
    if (isCorrect) {
      oldMistake.recover_count = Math.min(2, Number(oldMistake.recover_count || 0) + 1);
      if (oldMistake.recover_count >= 2)
        oldMistake.active = false;
    } else {
      oldMistake.error_count = Number(oldMistake.error_count || 0) + 1;
      oldMistake.recover_count = 0;
      oldMistake.active = true;
      oldMistake.last_wrong_at = now.toISOString();
      oldMistake.chinese = next.chinese || oldMistake.chinese;
    }
    oldMistake.english = next.english;
    oldMistake.bookIds = [.../* @__PURE__ */ new Set([...oldMistake.bookIds || [], bookId])];
    oldMistake.updated_at = now.toISOString();
    mistakes[key] = oldMistake;
    setMistakesMap(mistakes);
    return next;
  };
  const noteNewWordLearned = (word, options = {}) => {
    const now = /* @__PURE__ */ new Date();
    return saveWordProfile(word, {
      bookIds: [options.bookId || getCurrentWordbook() || "self"],
      source: options.source || "quick-add",
      first_learned_at: now.toISOString(),
      first_day_stage: 1,
      first_day_due_at: new Date(now.getTime() + 10 * 60 * 1e3).toISOString(),
      mastery: 8
    });
  };
  const clearMistake = (word) => {
    const key = normalizeWordKey(word);
    if (!key)
      return;
    const mistakes = getMistakesMap();
    if (!mistakes[key])
      return;
    mistakes[key] = {
      ...mistakes[key],
      active: false,
      recover_count: 2,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    setMistakesMap(mistakes);
  };
  const getMistakeWords = (bookId = "", onlyActive = true) => {
    const mistakes = Object.values(getMistakesMap() || {});
    return mistakes.filter((item) => item && item.english).filter((item) => !onlyActive || !!item.active).filter((item) => !bookId || Array.isArray(item.bookIds) && item.bookIds.includes(bookId)).sort((a2, b2) => {
      const diff = Number(b2.error_count || 0) - Number(a2.error_count || 0);
      if (diff !== 0)
        return diff;
      return new Date(b2.last_wrong_at || 0) - new Date(a2.last_wrong_at || 0);
    });
  };
  const getDueProfilesForWords = (words = [], bookId = "", now = /* @__PURE__ */ new Date()) => {
    const nowMs = now.getTime();
    return (Array.isArray(words) ? words : []).map((item) => {
      const profile = getWordProfile(item);
      if (!profile)
        return null;
      if (bookId && Array.isArray(profile.bookIds) && profile.bookIds.length && !profile.bookIds.includes(bookId))
        return null;
      const reviewDueMs = profile.next_review_time ? new Date(profile.next_review_time).getTime() : Infinity;
      const firstDayDueMs = profile.first_day_due_at ? new Date(profile.first_day_due_at).getTime() : Infinity;
      const dueMs = Math.min(reviewDueMs, firstDayDueMs);
      if (!Number.isFinite(dueMs) || dueMs > nowMs)
        return null;
      return {
        ...profile,
        dueMs,
        overdueMs: Math.max(0, nowMs - dueMs)
      };
    }).filter(Boolean).sort((a2, b2) => b2.overdueMs - a2.overdueMs);
  };
  const getLearningDashboard = (words = [], bookId = "", options = {}) => {
    const now = options.now ? new Date(options.now) : /* @__PURE__ */ new Date();
    const dueProfiles = getDueProfilesForWords(words, bookId, now);
    const mistakes = getMistakeWords(bookId, true);
    const profiles = (Array.isArray(words) ? words : []).map((item) => getWordProfile(item)).filter(Boolean);
    const masteryBuckets = {
      strong: 0,
      normal: 0,
      weak: 0,
      danger: 0
    };
    profiles.forEach((item) => {
      const mastery = Number(item.mastery || 0);
      if (mastery >= 80)
        masteryBuckets.strong++;
      else if (mastery >= 60)
        masteryBuckets.normal++;
      else if (mastery >= 35)
        masteryBuckets.weak++;
      else
        masteryBuckets.danger++;
    });
    const firstDayDue = dueProfiles.filter((item) => item.first_day_due_at && item.first_day_due_at === item.first_day_due_at && Number(item.first_day_stage || 0) > 0 && Number(item.first_day_stage || 0) < 4).length;
    const overdueCount = dueProfiles.filter((item) => item.dueMs < now.getTime()).length;
    return {
      dueCount: dueProfiles.length,
      overdueCount,
      mistakeCount: mistakes.length,
      firstDayDue,
      masteryBuckets,
      reviewedCount: profiles.length,
      latestMistakes: mistakes.slice(0, 5)
    };
  };
  const logStudySession = (session = {}) => {
    const list = getHistoryList();
    list.push({
      id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      bookId: session.bookId || getCurrentWordbook() || "self",
      mode: session.mode || "",
      preset: session.preset || "default",
      reviewedCount: Number(session.reviewedCount || 0),
      correctCount: Number(session.correctCount || 0),
      wrongCount: Number(session.wrongCount || 0),
      masteryBefore: Number(session.masteryBefore || 0),
      masteryAfter: Number(session.masteryAfter || 0),
      newCount: Number(session.newCount || 0),
      oldCount: Number(session.oldCount || 0),
      mistakeCount: Number(session.mistakeCount || 0)
    });
    setHistoryList(list);
  };
  const getDayKey = (dateLike) => {
    const date = new Date(dateLike);
    const y2 = date.getFullYear();
    const m2 = `${date.getMonth() + 1}`.padStart(2, "0");
    const d2 = `${date.getDate()}`.padStart(2, "0");
    return `${y2}-${m2}-${d2}`;
  };
  const getStudyStats = (words = [], bookId = "") => {
    const history = getHistoryList().filter((item) => !bookId || item.bookId === bookId);
    const dashboard = getLearningDashboard(words, bookId);
    const recentMap = {};
    history.forEach((item) => {
      const key = getDayKey(item.created_at);
      if (!recentMap[key]) {
        recentMap[key] = { day: key, reviewedCount: 0, correctCount: 0, wrongCount: 0 };
      }
      recentMap[key].reviewedCount += Number(item.reviewedCount || 0);
      recentMap[key].correctCount += Number(item.correctCount || 0);
      recentMap[key].wrongCount += Number(item.wrongCount || 0);
    });
    const trend = Object.values(recentMap).sort((a2, b2) => a2.day.localeCompare(b2.day)).slice(-7);
    let streak = 0;
    let cursor = /* @__PURE__ */ new Date();
    while (true) {
      const key = getDayKey(cursor);
      if (!recentMap[key])
        break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return {
      ...dashboard,
      totalSessions: history.length,
      totalReviewed: history.reduce((sum, item) => sum + Number(item.reviewedCount || 0), 0),
      totalCorrect: history.reduce((sum, item) => sum + Number(item.correctCount || 0), 0),
      totalWrong: history.reduce((sum, item) => sum + Number(item.wrongCount || 0), 0),
      streak,
      trend
    };
  };
  const getLatestSession = (bookId = "") => {
    const history = getHistoryList().filter((item) => !bookId || item.bookId === bookId).sort((a2, b2) => new Date(b2.created_at) - new Date(a2.created_at));
    return history[0] || null;
  };
  const getWordExtra = (word) => {
    const key = normalizeWordKey(word);
    if (!key)
      return {};
    const extras = getExtraMap();
    return extras[key] || {};
  };
  const saveWordExtra = (word, patch = {}) => {
    const key = normalizeWordKey(word);
    if (!key)
      return {};
    const extras = getExtraMap();
    const prev = extras[key] || {};
    const next = {
      ...prev,
      ...patch,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    extras[key] = next;
    setExtraMap(extras);
    return next;
  };
  const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
  };
  class Logger {
    constructor(minLevel = LogLevel.INFO, maxLogs = 500) {
      this.minLevel = minLevel;
      this.maxLogs = maxLogs;
      this.logs = [];
      this.listeners = [];
    }
    /**
     * 添加日志监听器
     */
    addListener(callback) {
      if (!this.listeners.includes(callback)) {
        this.listeners.push(callback);
      }
      if (this.listeners.length > 100) {
        formatAppLog("warn", "at src/utils/errorHandler.js:37", "[Logger] 监听器数量过多（>100），可能存在内存泄漏");
      }
    }
    /**
     * 移除日志监听器
     */
    removeListener(callback) {
      this.listeners = this.listeners.filter((l2) => l2 !== callback);
    }
    /**
     * 记录日志
     */
    log(level, tag, message, data = null) {
      if (level < this.minLevel)
        return;
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      const logEntry = {
        timestamp,
        level,
        tag,
        message,
        data
      };
      this.logs.push(logEntry);
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }
      this.listeners.forEach((listener) => {
        try {
          listener(logEntry);
        } catch (e2) {
          formatAppLog("error", "at src/utils/errorHandler.js:75", "[Logger] 监听器执行失败:", e2);
        }
      });
      this.printToConsole(level, tag, message, data);
    }
    /**
     * 输出到控制台
     */
    printToConsole(level, tag, message, data) {
      const levelName = Object.keys(LogLevel).find((k) => LogLevel[k] === level) || "UNKNOWN";
      const prefix = `[${levelName}] [${tag}]`;
      if (data !== null && data !== void 0) {
        formatAppLog("log", "at src/utils/errorHandler.js:91", `${prefix} ${message}`, data);
      } else {
        formatAppLog("log", "at src/utils/errorHandler.js:93", `${prefix} ${message}`);
      }
    }
    /**
     * 调试日志
     */
    debug(tag, message, data) {
      this.log(LogLevel.DEBUG, tag, message, data);
    }
    /**
     * 信息日志
     */
    info(tag, message, data) {
      this.log(LogLevel.INFO, tag, message, data);
    }
    /**
     * 警告日志
     */
    warn(tag, message, data) {
      this.log(LogLevel.WARN, tag, message, data);
    }
    /**
     * 错误日志
     */
    error(tag, message, data) {
      this.log(LogLevel.ERROR, tag, message, data);
    }
    /**
     * 获取所有日志
     */
    getLogs(level = null) {
      if (level === null)
        return [...this.logs];
      return this.logs.filter((log) => log.level >= level);
    }
    /**
     * 清空日志
     */
    clear() {
      this.logs = [];
    }
    /**
     * 导出日志为 JSON
     */
    exportAsJson() {
      return JSON.stringify(this.logs, null, 2);
    }
    /**
     * 导出日志为 CSV
     */
    exportAsCsv() {
      const headers = ["Timestamp", "Level", "Tag", "Message", "Data"];
      const rows = this.logs.map((log) => [
        log.timestamp,
        Object.keys(LogLevel).find((k) => LogLevel[k] === log.level),
        log.tag,
        log.message,
        typeof log.data === "object" ? JSON.stringify(log.data) : log.data
      ]);
      const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
      return csv;
    }
  }
  class ErrorHandler {
    constructor(logger2) {
      this.logger = logger2;
      this.errorHandlers = [];
    }
    /**
     * 添加错误处理器
     */
    addHandler(handler) {
      this.errorHandlers.push(handler);
    }
    /**
     * 处理错误
     */
    handle(error, context = {}) {
      const errorInfo = {
        message: error.message || String(error),
        stack: error.stack || "",
        type: error.constructor.name,
        context,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.logger.error("ErrorHandler", `${errorInfo.type}: ${errorInfo.message}`, errorInfo);
      this.errorHandlers.forEach((handler) => {
        try {
          handler(errorInfo);
        } catch (e2) {
          this.logger.error("ErrorHandler", "错误处理器执行失败", e2);
        }
      });
      return errorInfo;
    }
    /**
     * 处理 Promise 拒绝
     */
    handleRejection(reason, context = {}) {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      return this.handle(error, { ...context, type: "UnhandledRejection" });
    }
    /**
     * 处理异常
     */
    handleException(error, context = {}) {
      return this.handle(error, { ...context, type: "UncaughtException" });
    }
  }
  class GlobalErrorManager {
    constructor() {
      this.logger = new Logger(LogLevel.DEBUG);
      this.errorHandler = new ErrorHandler(this.logger);
      this.setupGlobalHandlers();
    }
    /**
     * 设置全局错误处理
     */
    setupGlobalHandlers() {
      if (typeof window !== "undefined") {
        window.addEventListener("unhandledrejection", (event) => {
          this.errorHandler.handleRejection(event.reason, { source: "unhandledrejection" });
        });
        window.addEventListener("error", (event) => {
          this.errorHandler.handleException(event.error, { source: "error" });
        });
      }
      if (typeof uni !== "undefined" && uni.onError) {
        uni.onError((error) => {
          this.errorHandler.handleException(error, { source: "uni.onError" });
        });
      }
    }
    /**
     * 获取日志器
     */
    getLogger() {
      return this.logger;
    }
    /**
     * 获取错误处理器
     */
    getErrorHandler() {
      return this.errorHandler;
    }
    /**
     * 记录性能指标
     */
    logPerformance(tag, duration, metadata = {}) {
      this.logger.info(tag, `性能指标: ${duration}ms`, { duration, ...metadata });
    }
    /**
     * 记录用户操作
     */
    logUserAction(action, data = {}) {
      this.logger.info("UserAction", action, data);
    }
    /**
     * 记录数据库操作
     */
    logDatabaseOperation(operation, duration, success = true, error = null) {
      if (success) {
        this.logger.info("Database", `${operation} 成功 (${duration}ms)`);
      } else {
        this.logger.error("Database", `${operation} 失败 (${duration}ms)`, error);
      }
    }
    /**
     * 获取诊断信息
     */
    getDiagnostics() {
      return {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        logs: this.logger.getLogs(),
        logCount: this.logger.logs.length,
        memoryUsage: this.getMemoryUsage()
      };
    }
    /**
     * 获取内存使用情况
     */
    getMemoryUsage() {
      if (typeof performance !== "undefined" && performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    }
    /**
     * 导出诊断信息
     */
    exportDiagnostics(format = "json") {
      const diagnostics = this.getDiagnostics();
      if (format === "json") {
        return JSON.stringify(diagnostics, null, 2);
      } else if (format === "csv") {
        return this.logger.exportAsCsv();
      }
      return diagnostics;
    }
  }
  const globalErrorManager = new GlobalErrorManager();
  const logger = globalErrorManager.getLogger();
  const errorHandler = globalErrorManager.getErrorHandler();
  class LRUCache {
    constructor(maxSize = 200, ttlMs = 5 * 60 * 1e3) {
      this.maxSize = maxSize;
      this.ttlMs = ttlMs;
      this.cache = /* @__PURE__ */ new Map();
      this.timestamps = /* @__PURE__ */ new Map();
    }
    /**
     * 获取缓存值
     * @param {string} key
     * @returns {*}
     */
    get(key) {
      if (!this.cache.has(key))
        return void 0;
      const timestamp = this.timestamps.get(key);
      if (timestamp && Date.now() - timestamp > this.ttlMs) {
        this.cache.delete(key);
        this.timestamps.delete(key);
        return void 0;
      }
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    /**
     * 设置缓存值
     * @param {string} key
     * @param {*} value
     */
    set(key, value) {
      if (this.cache.has(key)) {
        this.cache.delete(key);
      }
      if (this.cache.size >= this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
        this.timestamps.delete(firstKey);
      }
      this.cache.set(key, value);
      this.timestamps.set(key, Date.now());
    }
    /**
     * 检查是否存在
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {
      return this.get(key) !== void 0;
    }
    /**
     * 删除缓存
     * @param {string} key
     */
    delete(key) {
      this.cache.delete(key);
      this.timestamps.delete(key);
    }
    /**
     * 清空所有缓存
     */
    clear() {
      this.cache.clear();
      this.timestamps.clear();
    }
    /**
     * 获取缓存大小
     * @returns {number}
     */
    size() {
      return this.cache.size;
    }
    /**
     * 清理过期项
     */
    cleanup() {
      const now = Date.now();
      for (const [key, timestamp] of this.timestamps.entries()) {
        if (now - timestamp > this.ttlMs) {
          this.cache.delete(key);
          this.timestamps.delete(key);
        }
      }
    }
  }
  class MemoryCache {
    constructor(maxSize = 200, ttlMs = 5 * 60 * 1e3) {
      this.lru = new LRUCache(maxSize, ttlMs);
    }
    get(key, fallback = null) {
      const value = this.lru.get(key);
      return value !== void 0 ? value : fallback;
    }
    set(key, value) {
      this.lru.set(key, value);
    }
    has(key) {
      return this.lru.has(key);
    }
    delete(key) {
      this.lru.delete(key);
    }
    clear() {
      this.lru.clear();
    }
    size() {
      return this.lru.size();
    }
    cleanup() {
      this.lru.cleanup();
    }
  }
  const CACHE_TTL_MS = 5 * 60 * 1e3;
  const profilesMemCache = new MemoryCache(500, CACHE_TTL_MS);
  const mistakesMemCache = new MemoryCache(200, CACHE_TTL_MS);
  const cleanupExpiredCaches = () => {
    profilesMemCache.cleanup();
    mistakesMemCache.cleanup();
  };
  const ENRICH_CHUNK = 200;
  const FIRST_SCREEN_COUNT = 120;
  const HOT_TOP_COUNT = 20;
  const PAGE_SIZE = 50;
  const SHOW_CHINESE_KEY = "index_show_chinese_v1";
  const _sfc_main$b = {
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      let loadWordsInProgress = false;
      let allExternalWords = [];
      let plusReadyHandler = null;
      const mapSortByToDb = (sortBy2) => {
        const map = { create_time: "create_time", alphabetical: "english", importance: "importance", repeat_count: "repeat_count", view_count: "view_count", exam_count: "create_time" };
        return map[sortBy2] || "create_time";
      };
      const getFilters = () => ({
        search: searchText.value || void 0,
        tag: filterType.value === "tag" ? filterValue.value : void 0,
        year: filterType.value === "year" ? filterValue.value : void 0,
        page: filterType.value === "page" ? filterValue.value : void 0
      });
      function normalizeListWord(w2) {
        return {
          ...w2,
          id: w2.id || null,
          english: (w2.english || "").trim(),
          chinese: (w2.chinese || "").trim(),
          repeat_count: w2.repeat_count ?? 1,
          tags: (w2.tags || "").trim() ? String(w2.tags) : "",
          source_page: w2.source_page || "",
          year: w2.year || "",
          importance: Number(w2.importance) || 0,
          view_count: Number(w2.view_count) || 0,
          exam_count: w2.exam_count != null ? Number(w2.exam_count) || 0 : void 0,
          create_time: w2.create_time || ""
        };
      }
      function getExamCountForSort(word) {
        if (!word)
          return 0;
        if (word.exam_count != null)
          return Number(word.exam_count) || 0;
        return 0;
      }
      function sortExternalWords(list) {
        const arr = [...list];
        const order = sortOrder.value === "asc" ? 1 : -1;
        const type = sortBy.value;
        arr.sort((a2, b2) => {
          if (type === "alphabetical")
            return (a2.english || "").localeCompare(b2.english || "") * order;
          if (type === "importance")
            return ((Number(a2.importance) || 0) - (Number(b2.importance) || 0)) * order;
          if (type === "repeat_count")
            return ((Number(a2.repeat_count) || 0) - (Number(b2.repeat_count) || 0)) * order;
          if (type === "view_count")
            return ((Number(a2.view_count) || 0) - (Number(b2.view_count) || 0)) * order;
          if (type === "exam_count")
            return (getExamCountForSort(a2) - getExamCountForSort(b2)) * order;
          return (new Date(a2.create_time || 0) - new Date(b2.create_time || 0)) * order;
        });
        return arr;
      }
      function filterExternalWords(list) {
        let out = [...list];
        const q2 = (searchText.value || "").trim().toLowerCase();
        if (q2) {
          out = out.filter(
            (w2) => (w2.english || "").toLowerCase().includes(q2) || (w2.chinese || "").toLowerCase().includes(q2)
          );
        }
        if (filterType.value === "tag" && (filterValue.value || "").trim()) {
          const tag = String(filterValue.value).trim();
          out = out.filter((w2) => (w2.tags || "").split(/[,，\s]+/).map((t2) => t2.trim()).includes(tag));
        }
        if (filterType.value === "year" && filterValue.value !== "" && filterValue.value !== void 0) {
          out = out.filter((w2) => String(w2.year || "") === String(filterValue.value));
        }
        if (filterType.value === "page" && filterValue.value !== "" && filterValue.value !== void 0) {
          out = out.filter((w2) => String(w2.source_page || "") === String(filterValue.value));
        }
        return out;
      }
      function prepareExternalWords(raw) {
        const normalized = (raw || []).map(normalizeListWord);
        return sortExternalWords(filterExternalWords(normalized));
      }
      function enrichOneWord(w2, cache, dictLookup) {
        const key = (w2.english || "").trim().toLowerCase();
        if (!key)
          return;
        const info = dictLookup && dictLookup[key];
        const isObj = info && typeof info === "object" && !Array.isArray(info);
        if (!(w2.chinese || "").trim()) {
          if (isObj && (info.chinese || "").trim())
            w2.chinese = info.chinese.trim();
          else if (cache && cache[key] && cache[key].chinese)
            w2.chinese = cache[key].chinese;
          else if (info && typeof info === "string")
            w2.chinese = info;
        }
        if (info && isObj && typeof info.examCount === "number")
          w2.exam_count = info.examCount;
        if (isObj && (info.tags || "").trim())
          w2.tags = String(info.tags).trim();
        if (isObj && typeof info.importance === "number")
          w2.importance = info.importance;
      }
      const searchText = vue.ref("");
      const displayLimit = vue.ref(200);
      const showFilter = vue.ref(false);
      const showLearningCenter = vue.ref(false);
      const words = vue.ref([]);
      const refreshing = vue.ref(false);
      const sortBy = vue.ref("create_time");
      const filterType = vue.ref("none");
      const filterValue = vue.ref("");
      const showChinese = vue.ref(true);
      const learningSnapshot = vue.ref({ dueCount: 0, mistakeCount: 0, firstDayDue: 0, overdueCount: 0 });
      const latestSession = vue.ref(null);
      const sortOptions = ["create_time", "alphabetical", "importance", "repeat_count", "view_count", "exam_count"];
      const sortLabels = ["按录入时间", "按首字母", "按重要程度", "按学习次数", "按查看次数", "按真题频次"];
      const sortOrderOptions = ["asc", "desc"];
      const sortOrderLabels = ["顺序", "倒序"];
      const sortOrder = vue.ref("desc");
      const showChineseLabels = ["显示释义", "隐藏释义"];
      const hasMoreSelfWords = vue.ref(true);
      const allExternalWordsLength = vue.ref(0);
      const filterOptions = ["none", "tag", "year", "page"];
      const filterLabels = ["无筛选", "按标签", "按真题年份", "按纸质页码"];
      const PRESET_TAGS = ["高频", "阅读词汇", "完形词汇", "翻译词汇", "新题型词汇", "写作词汇", "作文词", "口语词", "学术词"];
      const tagOptions = vue.computed(() => {
        const fromWords = /* @__PURE__ */ new Set();
        (words.value || []).forEach((w2) => {
          const t2 = (w2.tags || "").split(/[,，\s]+/).filter(Boolean);
          t2.forEach((x) => fromWords.add(x));
        });
        return [...PRESET_TAGS, ...Array.from(fromWords).filter((t2) => !PRESET_TAGS.includes(t2))];
      });
      const currentSortLabel = vue.computed(() => {
        const index = sortOptions.indexOf(sortBy.value);
        return index >= 0 ? sortLabels[index] : "按录入时间";
      });
      const currentFilterLabel = vue.computed(() => {
        const index = filterOptions.indexOf(filterType.value);
        return index >= 0 ? filterLabels[index] : "无筛选";
      });
      const currentBookLabel = vue.computed(() => getCurrentWordbook() || "当前词书");
      const latestAccuracyText = vue.computed(() => {
        const value = latestSession.value && latestSession.value.reviewedCount ? `${Math.round(Number(latestSession.value.correctCount || 0) / Math.max(1, Number(latestSession.value.reviewedCount || 0)) * 100)}%` : "--";
        return value;
      });
      const loadLearningSnapshot = async () => {
        try {
          const book = getCurrentWordbook();
          let pool = [];
          if (book === "self") {
            pool = await db.getAllWords();
          } else if (isLocalWordbookKey(book)) {
            pool = await loadLocalWordbook(book);
          } else {
            pool = getWordbookWords(book) || [];
          }
          learningSnapshot.value = getLearningDashboard(pool, book);
          latestSession.value = getLatestSession(book);
        } catch (_2) {
          learningSnapshot.value = { dueCount: 0, mistakeCount: 0, firstDayDue: 0, overdueCount: 0 };
          latestSession.value = null;
        }
      };
      const onListRefresh = async () => {
        refreshing.value = true;
        await loadWords();
        if (isSelfWordbook())
          await syncIncompleteWordsWithStats();
        await loadLearningSnapshot();
        refreshing.value = false;
      };
      function applyEnrichedToRef(list, wordsRef) {
        if (!list || list.length === 0 || !wordsRef || !Array.isArray(wordsRef.value))
          return;
        const dict = {};
        for (const item of list) {
          const key = (item && item.english || "").trim().toLowerCase();
          if (key)
            dict[key] = item;
        }
        wordsRef.value = wordsRef.value.map((w2) => {
          const key = (w2 && w2.english || "").trim().toLowerCase();
          const hit = key ? dict[key] : null;
          if (!hit)
            return w2;
          return {
            ...w2,
            chinese: hit.chinese !== void 0 && hit.chinese !== null ? hit.chinese : w2.chinese,
            tags: hit.tags !== void 0 && hit.tags !== null ? hit.tags : w2.tags,
            exam_count: hit.exam_count !== void 0 && hit.exam_count !== null ? hit.exam_count : w2.exam_count,
            importance: hit.importance !== void 0 && hit.importance !== null ? hit.importance : w2.importance
          };
        });
      }
      function buildChineseFromDefs2(defs) {
        if (!Array.isArray(defs) || defs.length === 0)
          return "";
        const parts = [];
        for (const d2 of defs) {
          if (!d2 || typeof d2 !== "object")
            continue;
          const pos = String(d2.pos || "").trim();
          const trans = String(d2.trans || "").trim();
          if (!trans)
            continue;
          parts.push(pos ? `${pos} ${trans}` : trans);
          if (parts.length >= 4)
            break;
        }
        return parts.join("；");
      }
      async function fallbackEnrichByFullDetail(list, bookAtLoad, wordsRef) {
        if (!Array.isArray(list) || list.length === 0 || !wordsRef || !Array.isArray(wordsRef.value))
          return;
        const missing = list.filter((w2) => {
          const noChinese = !(w2.chinese || "").trim();
          const noTags = !(w2.tags || "").trim();
          return (w2.english || "").trim() && (noChinese || noTags);
        }).slice(0, 60);
        if (missing.length === 0)
          return;
        const updates = {};
        await Promise.all(missing.map(async (w2) => {
          try {
            const detail = await getWordFullDetail(w2.english);
            const key = (w2.english || "").trim().toLowerCase();
            if (!key)
              return;
            let chinese = "";
            let tags = "";
            let examCount = void 0;
            if (detail) {
              chinese = (detail.chinese || "").trim();
              if (!chinese)
                chinese = buildChineseFromDefs2(detail.defs);
              tags = detail.examStats && Array.isArray(detail.examStats.tags) ? detail.examStats.tags.join(",") : "";
              examCount = detail.examStats && typeof detail.examStats.total_count === "number" ? detail.examStats.total_count : void 0;
            }
            if (!chinese) {
              try {
                const pre = await getPregenWord(w2.english);
                if (pre && (pre.chinese || "").trim())
                  chinese = pre.chinese.trim();
              } catch (_2) {
              }
            }
            updates[key] = {
              chinese,
              tags: tags || "",
              exam_count: examCount
            };
          } catch (_2) {
          }
        }));
        if (getCurrentWordbook() !== bookAtLoad)
          return;
        if (Object.keys(updates).length === 0)
          return;
        wordsRef.value = wordsRef.value.map((w2) => {
          const key = (w2.english || "").trim().toLowerCase();
          const u2 = key ? updates[key] : null;
          if (!u2)
            return w2;
          return {
            ...w2,
            chinese: (u2.chinese || "").trim() || w2.chinese,
            tags: (u2.tags || "").trim() || w2.tags,
            exam_count: u2.exam_count != null ? u2.exam_count : w2.exam_count
          };
        });
      }
      function countMissingChineseForList(list, wordsRef) {
        if (!Array.isArray(list) || !Array.isArray(wordsRef == null ? void 0 : wordsRef.value))
          return 0;
        const set = new Set(list.map((w2) => ((w2 == null ? void 0 : w2.english) || "").trim().toLowerCase()).filter(Boolean));
        let n2 = 0;
        for (const w2 of wordsRef.value) {
          const key = ((w2 == null ? void 0 : w2.english) || "").trim().toLowerCase();
          if (!key || !set.has(key))
            continue;
          if (!(w2.chinese || "").trim())
            n2++;
        }
        return n2;
      }
      async function retryEnrichUntilReady(list, bookAtLoad, wordsRef) {
        const MAX_RETRY = 8;
        const INTERVAL_MS = 800;
        await new Promise((r2) => setTimeout(r2, 600));
        for (let i2 = 0; i2 < MAX_RETRY; i2++) {
          if (getCurrentWordbook() !== bookAtLoad)
            return;
          const missing = countMissingChineseForList(list, wordsRef);
          if (missing <= 0)
            return;
          await new Promise((r2) => setTimeout(r2, INTERVAL_MS));
          try {
            const englishList = list.map((w2) => (w2.english || "").trim().toLowerCase()).filter(Boolean);
            const dictLookup = await getWordBriefBatch(englishList).catch(() => ({}));
            for (const item of list)
              enrichOneWord(item, {}, dictLookup || {});
            applyEnrichedToRef(list, wordsRef);
          } catch (_2) {
          }
          await fallbackEnrichByFullDetail(list, bookAtLoad, wordsRef);
        }
      }
      const enrichWordbookListInBackground = async (list, bookAtLoad, wordsRef) => {
        if (!list || list.length === 0 || !wordsRef)
          return;
        try {
          const englishList = list.map((w2) => (w2.english || "").trim().toLowerCase()).filter(Boolean);
          if (getCurrentWordbook() !== bookAtLoad)
            return;
          const hotList = list.slice(0, Math.min(HOT_TOP_COUNT, list.length));
          const hotKeys = hotList.map((w2) => (w2.english || "").trim().toLowerCase()).filter(Boolean);
          let hotLookup = {};
          try {
            hotLookup = await getWordBriefBatch(hotKeys);
            if ((!hotLookup || Object.keys(hotLookup).length === 0) && getCurrentWordbook() === bookAtLoad) {
              await new Promise((r2) => setTimeout(r2, 120));
              hotLookup = await getWordBriefBatch(hotKeys);
            }
          } catch (_2) {
          }
          if (getCurrentWordbook() !== bookAtLoad)
            return;
          for (let i2 = 0; i2 < hotList.length; i2++)
            enrichOneWord(hotList[i2], null, hotLookup || {});
          applyEnrichedToRef(list, wordsRef);
          const restList = list.slice(hotList.length);
          const restKeys = restList.map((w2) => (w2.english || "").trim().toLowerCase()).filter(Boolean);
          let restLookup = {};
          if (restKeys.length) {
            try {
              restLookup = await getWordBriefBatch(restKeys);
            } catch (_2) {
            }
          }
          if (getCurrentWordbook() !== bookAtLoad)
            return;
          for (let i2 = 0; i2 < restList.length; i2++) {
            enrichOneWord(restList[i2], null, restLookup || {});
            if ((i2 + 1) % ENRICH_CHUNK === 0) {
              applyEnrichedToRef(list, wordsRef);
              await new Promise((r2) => setTimeout(r2, 0));
            }
          }
          applyEnrichedToRef(list, wordsRef);
          await fallbackEnrichByFullDetail(list, bookAtLoad, wordsRef);
          retryEnrichUntilReady(list, bookAtLoad, wordsRef);
        } catch (_2) {
        }
      };
      const reEnrichCurrentWordbook = async () => {
        const book = getCurrentWordbook();
        if (!words.value || words.value.length === 0)
          return;
        await enrichWordbookListInBackground(words.value, book, words);
      };
      const syncIncompleteWordsWithStats = async () => {
        try {
          const list = words.value || [];
          const englishList = list.map((w2) => (w2.english || "").trim()).filter(Boolean);
          const statsMap = await getWordExamStatsBatch(englishList).catch(() => ({}));
          for (const w2 of list) {
            const info = statsMap[(w2.english || "").trim().toLowerCase()];
            if (!info)
              continue;
            const updates = {};
            if (typeof info.importance === "number" && info.importance !== (Number(w2.importance) || 0))
              updates.importance = info.importance;
            if ((info.tags || "").trim() && !(w2.tags || "").trim())
              updates.tags = info.tags;
            if (Object.keys(updates).length)
              await db.updateWord(w2.id, updates);
          }
        } catch (_2) {
        }
      };
      const loadWords = async () => {
        if (loadWordsInProgress)
          return;
        loadWordsInProgress = true;
        try {
          const book = getCurrentWordbook();
          if (book === "self") {
            const list = await db.getWordsForList(PAGE_SIZE, 0, mapSortByToDb(sortBy.value), sortOrder.value, getFilters());
            words.value = list.map(normalizeListWord);
            hasMoreSelfWords.value = list.length >= PAGE_SIZE;
            allExternalWords = [];
            allExternalWordsLength.value = 0;
            enrichWordbookListInBackground(words.value, book, words);
            formatAppLog("log", "at pages/index/index.vue:555", "极速加载：自用分页成功，数量:", words.value.length);
            await loadLearningSnapshot();
            return;
          }
          let raw = [];
          if (isLocalWordbookKey(book)) {
            raw = await loadLocalWordbook(book);
          } else {
            raw = getWordbookWords(book) || [];
          }
          allExternalWords = prepareExternalWords(raw);
          allExternalWordsLength.value = allExternalWords.length;
          words.value = allExternalWords.slice(0, PAGE_SIZE);
          displayLimit.value = PAGE_SIZE;
          formatAppLog("log", "at pages/index/index.vue:572", "极速加载：外部单词本首屏成功，响应式数量:", words.value.length, "全量:", allExternalWords.length);
          enrichWordbookListInBackground(words.value, book, words);
          await loadLearningSnapshot();
        } catch (error) {
          formatAppLog("error", "at pages/index/index.vue:577", "加载失败:", error);
          words.value = [];
        } finally {
          loadWordsInProgress = false;
        }
      };
      onLoad(() => {
        formatAppLog("log", "at pages/index/index.vue:585", "首页 onLoad - 开始加载");
        try {
          const v2 = uni.getStorageSync(SHOW_CHINESE_KEY);
          if (v2 === false || v2 === "false" || v2 === 0 || v2 === "0")
            showChinese.value = false;
        } catch (_2) {
        }
        loadWords().catch((error) => {
          formatAppLog("error", "at pages/index/index.vue:593", "首页加载单词失败:", error);
          uni.showToast({
            title: "加载失败，请重试",
            icon: "error"
          });
        });
        try {
          if (typeof plus !== "undefined" && typeof document !== "undefined") {
            plusReadyHandler = () => {
              reEnrichCurrentWordbook();
            };
            document.addEventListener("plusready", plusReadyHandler, false);
          }
        } catch (_2) {
        }
        uni.$on("refreshWordList", () => loadWords());
        uni.$on("wordEnriched", () => loadWords());
        uni.$on("wordbookChanged", () => {
          words.value = [];
          loadWords();
        });
      });
      onShow(() => {
        if (words.value.length === 0)
          loadWords();
        else {
          setTimeout(() => reEnrichCurrentWordbook(), 350);
        }
        loadLearningSnapshot();
      });
      onUnload(() => {
        uni.$off("refreshWordList");
        uni.$off("wordEnriched");
        uni.$off("wordbookChanged");
        try {
          if (plusReadyHandler && typeof document !== "undefined") {
            document.removeEventListener("plusready", plusReadyHandler, false);
          }
        } catch (_2) {
        }
        plusReadyHandler = null;
        try {
          cleanupExpiredCaches();
        } catch (error) {
          logger.warn("Index", "清理缓存失败", error);
        }
      });
      let searchDebounceTimer = null;
      let filterDebounceTimer = null;
      vue.watch(searchText, () => {
        if (searchDebounceTimer)
          clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
          loadWords();
        }, 300);
      });
      vue.watch(filterValue, () => {
        if (filterDebounceTimer)
          clearTimeout(filterDebounceTimer);
        filterDebounceTimer = setTimeout(() => {
          if (filterType.value === "none")
            return;
          loadWords();
        }, 220);
      });
      const filteredWords = vue.computed(() => {
        if (isSelfWordbook())
          return [...words.value];
        return [...words.value];
      });
      const visibleWords = vue.computed(() => {
        if (isSelfWordbook())
          return words.value;
        return words.value;
      });
      const hasMoreWords = vue.computed(() => {
        if (isSelfWordbook())
          return hasMoreSelfWords.value;
        return words.value.length < allExternalWordsLength.value;
      });
      const loadMoreSelfWords = async () => {
        if (!hasMoreSelfWords.value || !isSelfWordbook())
          return;
        const next = await db.getWordsForList(PAGE_SIZE, words.value.length, mapSortByToDb(sortBy.value), sortOrder.value, getFilters());
        const normalizedNext = next.map(normalizeListWord);
        words.value = [...words.value, ...normalizedNext];
        enrichWordbookListInBackground(normalizedNext, getCurrentWordbook(), words);
        hasMoreSelfWords.value = next.length >= PAGE_SIZE;
      };
      const onScrollToLower = () => {
        if (!hasMoreWords.value)
          return;
        if (isSelfWordbook()) {
          loadMoreSelfWords();
          return;
        }
        const currentLen = words.value.length;
        if (currentLen < allExternalWords.length) {
          const nextBatch = allExternalWords.slice(currentLen, currentLen + PAGE_SIZE);
          words.value = [...words.value, ...nextBatch];
          enrichWordbookListInBackground(nextBatch, getCurrentWordbook(), words);
        }
      };
      const onSortChange = (e2) => {
        const index = e2.detail.value;
        sortBy.value = sortOptions[index];
        loadWords();
      };
      const onSortOrderChange = (e2) => {
        const index = e2.detail.value;
        sortOrder.value = sortOrderOptions[index] || "desc";
        loadWords();
      };
      const onFilterChange = (e2) => {
        const index = e2.detail.value;
        filterType.value = filterOptions[index];
        loadWords();
      };
      const onShowChineseChange = (e2) => {
        var _a;
        const idx = Number(((_a = e2 == null ? void 0 : e2.detail) == null ? void 0 : _a.value) ?? 0);
        showChinese.value = idx === 0;
        try {
          uni.setStorageSync(SHOW_CHINESE_KEY, showChinese.value);
        } catch (_2) {
        }
      };
      const onTagChange = (e2) => {
        const idx = e2.detail.value;
        const list = tagOptions.value;
        filterValue.value = list[idx] || "";
        loadWords();
      };
      const clearFilter = () => {
        filterType.value = "none";
        filterValue.value = "";
        loadWords();
      };
      const goToDetail = (word) => {
        if (word.id) {
          uni.navigateTo({ url: `/pages/word-detail/word-detail?id=${word.id}` });
        } else {
          uni.navigateTo({ url: `/pages/word-detail/word-detail?english=${encodeURIComponent(word.english)}&fromWordbook=1` });
        }
      };
      const goToReview = () => {
        uni.navigateTo({
          url: `/pages/review/review`
        });
      };
      const goToReviewPreset = (preset) => {
        uni.navigateTo({
          url: `/pages/review/review?preset=${encodeURIComponent(preset || "default")}`
        });
      };
      const goToQuickAdd = () => {
        uni.navigateTo({
          url: `/pages/quick-add/quick-add`
        });
      };
      const goToMy = () => {
        uni.navigateTo({
          url: `/pages/my/my`
        });
      };
      const goToStats = () => {
        uni.navigateTo({ url: "/pages/stats/stats" });
      };
      const goToMistakes = () => {
        uni.navigateTo({ url: "/pages/mistakes/mistakes" });
      };
      const getExamCount = (word) => {
        if (!word || !word.english)
          return 0;
        if (word.exam_count != null)
          return Number(word.exam_count) || 0;
        return 0;
      };
      const onSearchInput = (e2) => {
        searchText.value = e2.detail.value || "";
      };
      const onSearchConfirm = () => {
        loadWords();
      };
      const __returned__ = { ENRICH_CHUNK, FIRST_SCREEN_COUNT, HOT_TOP_COUNT, PAGE_SIZE, get loadWordsInProgress() {
        return loadWordsInProgress;
      }, set loadWordsInProgress(v2) {
        loadWordsInProgress = v2;
      }, get allExternalWords() {
        return allExternalWords;
      }, set allExternalWords(v2) {
        allExternalWords = v2;
      }, get plusReadyHandler() {
        return plusReadyHandler;
      }, set plusReadyHandler(v2) {
        plusReadyHandler = v2;
      }, mapSortByToDb, getFilters, normalizeListWord, getExamCountForSort, sortExternalWords, filterExternalWords, prepareExternalWords, enrichOneWord, searchText, displayLimit, showFilter, showLearningCenter, words, refreshing, sortBy, filterType, filterValue, SHOW_CHINESE_KEY, showChinese, learningSnapshot, latestSession, sortOptions, sortLabels, sortOrderOptions, sortOrderLabels, sortOrder, showChineseLabels, hasMoreSelfWords, allExternalWordsLength, filterOptions, filterLabels, PRESET_TAGS, tagOptions, currentSortLabel, currentFilterLabel, currentBookLabel, latestAccuracyText, loadLearningSnapshot, onListRefresh, applyEnrichedToRef, buildChineseFromDefs: buildChineseFromDefs2, fallbackEnrichByFullDetail, countMissingChineseForList, retryEnrichUntilReady, enrichWordbookListInBackground, reEnrichCurrentWordbook, syncIncompleteWordsWithStats, loadWords, get searchDebounceTimer() {
        return searchDebounceTimer;
      }, set searchDebounceTimer(v2) {
        searchDebounceTimer = v2;
      }, get filterDebounceTimer() {
        return filterDebounceTimer;
      }, set filterDebounceTimer(v2) {
        filterDebounceTimer = v2;
      }, filteredWords, visibleWords, hasMoreWords, loadMoreSelfWords, onScrollToLower, onSortChange, onSortOrderChange, onFilterChange, onShowChineseChange, onTagChange, clearFilter, goToDetail, goToReview, goToReviewPreset, goToQuickAdd, goToMy, goToStats, goToMistakes, getExamCount, onSearchInput, onSearchConfirm, ref: vue.ref, computed: vue.computed, watch: vue.watch, VocalColorBlockSelector, get onLoad() {
        return onLoad;
      }, get onUnload() {
        return onUnload;
      }, get onShow() {
        return onShow;
      }, get onReady() {
        return onReady;
      }, get db() {
        return db;
      }, get pregenVocab() {
        return pregenVocab;
      }, get masterDb() {
        return masterDb;
      }, get getCurrentWordbook() {
        return getCurrentWordbook;
      }, get isSelfWordbook() {
        return isSelfWordbook;
      }, get isLocalWordbookKey() {
        return isLocalWordbookKey;
      }, get loadLocalWordbook() {
        return loadLocalWordbook;
      }, get getWordbookWords() {
        return getWordbookWords;
      }, get getLearningDashboard() {
        return getLearningDashboard;
      }, get getLatestSession() {
        return getLatestSession;
      }, get logger() {
        return logger;
      }, get errorHandler() {
        return errorHandler;
      }, get cleanupExpiredCaches() {
        return cleanupExpiredCaches;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$b(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "status-bar" }),
      vue.createElementVNode("view", { class: "toolbar-row" }, [
        vue.createElementVNode(
          "view",
          {
            class: "toolbar-btn",
            onClick: _cache[0] || (_cache[0] = ($event) => $setup.showFilter = !$setup.showFilter)
          },
          " 筛选排序 " + vue.toDisplayString($setup.showFilter ? "▲" : "▼"),
          1
          /* TEXT */
        ),
        vue.createElementVNode(
          "view",
          {
            class: "toolbar-btn",
            onClick: _cache[1] || (_cache[1] = ($event) => $setup.showLearningCenter = !$setup.showLearningCenter)
          },
          " 学习中心 " + vue.toDisplayString($setup.showLearningCenter ? "▲" : "▼"),
          1
          /* TEXT */
        )
      ]),
      vue.createElementVNode("view", { class: "search-bar" }, [
        vue.createElementVNode("view", { class: "search-input-wrapper" }, [
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              type: "text",
              placeholder: "搜索单词",
              "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $setup.searchText = $event),
              class: "search-input",
              onInput: $setup.onSearchInput,
              onConfirm: $setup.onSearchConfirm
            },
            null,
            544
            /* NEED_HYDRATION, NEED_PATCH */
          ), [
            [vue.vModelText, $setup.searchText]
          ])
        ])
      ]),
      $setup.showFilter ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "card filter-card"
      }, [
        vue.createElementVNode("view", { class: "filter-header" }, [
          vue.createElementVNode("view", { class: "card-title" }, "筛选与排序"),
          vue.createElementVNode("view", {
            class: "filter-close",
            onClick: _cache[3] || (_cache[3] = ($event) => $setup.showFilter = false)
          }, "✕")
        ]),
        vue.createElementVNode("view", { class: "filter-row" }, [
          vue.createVNode($setup["VocalColorBlockSelector"], {
            range: $setup.sortLabels,
            value: $setup.sortOptions.indexOf($setup.sortBy.value),
            onChange: $setup.onSortChange
          }, {
            default: vue.withCtx(() => [
              vue.createElementVNode(
                "view",
                { class: "picker-btn" },
                vue.toDisplayString($setup.currentSortLabel) + " ▼",
                1
                /* TEXT */
              )
            ]),
            _: 1
            /* STABLE */
          }, 8, ["value"]),
          vue.createVNode($setup["VocalColorBlockSelector"], {
            range: $setup.sortOrderLabels,
            value: $setup.sortOrderOptions.indexOf($setup.sortOrder),
            onChange: $setup.onSortOrderChange
          }, {
            default: vue.withCtx(() => [
              vue.createElementVNode(
                "view",
                { class: "picker-btn" },
                vue.toDisplayString($setup.sortOrder === "asc" ? "顺序" : "倒序") + " ▼",
                1
                /* TEXT */
              )
            ]),
            _: 1
            /* STABLE */
          }, 8, ["value"]),
          vue.createVNode($setup["VocalColorBlockSelector"], {
            range: $setup.filterLabels,
            value: $setup.filterOptions.indexOf($setup.filterType.value),
            onChange: $setup.onFilterChange
          }, {
            default: vue.withCtx(() => [
              vue.createElementVNode(
                "view",
                { class: "picker-btn" },
                vue.toDisplayString($setup.currentFilterLabel) + " ▼",
                1
                /* TEXT */
              )
            ]),
            _: 1
            /* STABLE */
          }, 8, ["value"]),
          vue.createVNode($setup["VocalColorBlockSelector"], {
            range: $setup.showChineseLabels,
            value: $setup.showChinese ? 0 : 1,
            onChange: $setup.onShowChineseChange
          }, {
            default: vue.withCtx(() => [
              vue.createElementVNode(
                "view",
                { class: "picker-btn" },
                vue.toDisplayString($setup.showChinese ? "显示释义" : "隐藏释义") + " ▼",
                1
                /* TEXT */
              )
            ]),
            _: 1
            /* STABLE */
          }, 8, ["value"])
        ]),
        $setup.filterType.value === "tag" ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "filter-row"
        }, [
          vue.createVNode($setup["VocalColorBlockSelector"], {
            range: $setup.tagOptions,
            value: $setup.tagOptions.indexOf($setup.filterValue),
            onChange: $setup.onTagChange
          }, {
            default: vue.withCtx(() => [
              vue.createElementVNode(
                "view",
                { class: "picker-btn" },
                vue.toDisplayString($setup.filterValue || "选择标签") + " ▼",
                1
                /* TEXT */
              )
            ]),
            _: 1
            /* STABLE */
          }, 8, ["range", "value"]),
          vue.createElementVNode("button", {
            class: "clear-btn",
            onClick: $setup.clearFilter
          }, "清除")
        ])) : $setup.filterType.value !== "none" ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "filter-row"
        }, [
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              class: "filter-input",
              type: "number",
              "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $setup.filterValue = $event),
              placeholder: "输入筛选值"
            },
            null,
            512
            /* NEED_PATCH */
          ), [
            [
              vue.vModelText,
              $setup.filterValue,
              void 0,
              { number: true }
            ]
          ]),
          vue.createElementVNode("button", {
            class: "clear-btn",
            onClick: $setup.clearFilter
          }, "清除")
        ])) : vue.createCommentVNode("v-if", true)
      ])) : vue.createCommentVNode("v-if", true),
      $setup.showLearningCenter ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "card lc-panel"
      }, [
        vue.createElementVNode("view", { class: "learning-summary-grid" }, [
          vue.createElementVNode("view", {
            class: "learning-summary-item",
            onClick: _cache[5] || (_cache[5] = ($event) => $setup.goToReviewPreset("due"))
          }, [
            vue.createElementVNode(
              "text",
              { class: "learning-summary-value" },
              vue.toDisplayString($setup.learningSnapshot.dueCount),
              1
              /* TEXT */
            ),
            vue.createElementVNode("text", { class: "learning-summary-label" }, "今日到期")
          ]),
          vue.createElementVNode("view", {
            class: "learning-summary-item",
            onClick: _cache[6] || (_cache[6] = ($event) => $setup.goToReviewPreset("wrong"))
          }, [
            vue.createElementVNode(
              "text",
              { class: "learning-summary-value" },
              vue.toDisplayString($setup.learningSnapshot.mistakeCount),
              1
              /* TEXT */
            ),
            vue.createElementVNode("text", { class: "learning-summary-label" }, "错词待练")
          ]),
          vue.createElementVNode("view", {
            class: "learning-summary-item",
            onClick: _cache[7] || (_cache[7] = ($event) => $setup.goToReviewPreset("firstday"))
          }, [
            vue.createElementVNode(
              "text",
              { class: "learning-summary-value" },
              vue.toDisplayString($setup.learningSnapshot.firstDayDue),
              1
              /* TEXT */
            ),
            vue.createElementVNode("text", { class: "learning-summary-label" }, "首日巩固")
          ]),
          vue.createElementVNode("view", {
            class: "learning-summary-item",
            onClick: $setup.goToStats
          }, [
            vue.createElementVNode(
              "text",
              { class: "learning-summary-value" },
              vue.toDisplayString($setup.latestAccuracyText),
              1
              /* TEXT */
            ),
            vue.createElementVNode("text", { class: "learning-summary-label" }, "最近正确率")
          ])
        ]),
        vue.createElementVNode("view", { class: "learning-actions" }, [
          vue.createElementVNode("button", {
            class: "learning-action-btn",
            onClick: _cache[8] || (_cache[8] = ($event) => $setup.goToReviewPreset("due"))
          }, "到期复习"),
          vue.createElementVNode("button", {
            class: "learning-action-btn secondary",
            onClick: $setup.goToMistakes
          }, "错词本"),
          vue.createElementVNode("button", {
            class: "learning-action-btn secondary",
            onClick: $setup.goToStats
          }, "学习统计")
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createElementVNode("scroll-view", {
        class: "word-list",
        "scroll-y": "",
        "refresher-enabled": true,
        "refresher-triggered": $setup.refreshing,
        "refresher-background": "#FFF0F3",
        onRefresherrefresh: $setup.onListRefresh,
        onScrolltolower: $setup.onScrollToLower,
        style: { "background-color": "#FFF0F3" }
      }, [
        $setup.filteredWords.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "empty-state"
        }, [
          vue.createElementVNode(
            "view",
            { class: "empty-text" },
            vue.toDisplayString($setup.searchText || $setup.filterType !== "none" && ($setup.filterValue !== "" && $setup.filterValue !== void 0) ? "未找到匹配的单词" : "还没有单词，开始添加吧"),
            1
            /* TEXT */
          ),
          !$setup.searchText && ($setup.filterType === "none" || ($setup.filterValue === "" || $setup.filterValue === void 0)) ? (vue.openBlock(), vue.createElementBlock("button", {
            key: 0,
            class: "empty-btn",
            onClick: $setup.goToQuickAdd
          }, "添加单词")) : vue.createCommentVNode("v-if", true)
        ])) : vue.createCommentVNode("v-if", true),
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($setup.visibleWords, (word) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              class: "word-item",
              key: word.id || "wb-" + word.english
            }, [
              vue.createElementVNode("view", {
                class: "word-content",
                onClick: ($event) => $setup.goToDetail(word)
              }, [
                vue.createElementVNode("view", { class: "word-english" }, [
                  vue.createTextVNode(
                    vue.toDisplayString(word.english) + " ",
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "span",
                    { class: "repeat-count" },
                    "学习" + vue.toDisplayString(word.repeat_count || 0) + "次",
                    1
                    /* TEXT */
                  )
                ]),
                $setup.showChinese ? (vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: 0,
                    class: "word-chinese"
                  },
                  vue.toDisplayString(word.chinese || "—"),
                  1
                  /* TEXT */
                )) : vue.createCommentVNode("v-if", true),
                word.source_page || word.year || $setup.getExamCount(word) ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 1,
                  class: "word-source"
                }, [
                  word.source_page || word.year ? (vue.openBlock(), vue.createElementBlock(
                    vue.Fragment,
                    { key: 0 },
                    [
                      vue.createTextVNode(
                        "页码 " + vue.toDisplayString(word.source_page || "-") + " · 年份 " + vue.toDisplayString(word.year || "-"),
                        1
                        /* TEXT */
                      )
                    ],
                    64
                    /* STABLE_FRAGMENT */
                  )) : vue.createCommentVNode("v-if", true),
                  $setup.getExamCount(word) ? (vue.openBlock(), vue.createElementBlock(
                    "text",
                    {
                      key: 1,
                      class: "word-exam-count"
                    },
                    "真题 " + vue.toDisplayString($setup.getExamCount(word)) + "次",
                    1
                    /* TEXT */
                  )) : vue.createCommentVNode("v-if", true)
                ])) : vue.createCommentVNode("v-if", true),
                word.tags ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 2,
                  class: "word-tags"
                }, [
                  (vue.openBlock(true), vue.createElementBlock(
                    vue.Fragment,
                    null,
                    vue.renderList((word.tags || "").split(/[,，\s]+/).filter(Boolean), (t2, i2) => {
                      return vue.openBlock(), vue.createElementBlock(
                        "text",
                        {
                          key: i2,
                          class: "tag-chip"
                        },
                        vue.toDisplayString(t2),
                        1
                        /* TEXT */
                      );
                    }),
                    128
                    /* KEYED_FRAGMENT */
                  ))
                ])) : vue.createCommentVNode("v-if", true),
                vue.createElementVNode("view", { class: "word-importance" }, [
                  (vue.openBlock(), vue.createElementBlock(
                    vue.Fragment,
                    null,
                    vue.renderList(5, (star) => {
                      return vue.createElementVNode(
                        "span",
                        {
                          key: star,
                          class: vue.normalizeClass(["star", { active: (word.importance || 0) >= star }])
                        },
                        "★",
                        2
                        /* CLASS */
                      );
                    }),
                    64
                    /* STABLE_FRAGMENT */
                  ))
                ])
              ], 8, ["onClick"])
            ]);
          }),
          128
          /* KEYED_FRAGMENT */
        )),
        $setup.hasMoreWords ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "load-more",
          onClick: $setup.onScrollToLower
        }, "加载更多")) : vue.createCommentVNode("v-if", true)
      ], 40, ["refresher-triggered"]),
      vue.createElementVNode("view", { class: "footer" }, [
        vue.createElementVNode("button", { onClick: $setup.goToQuickAdd }, "添加"),
        vue.createElementVNode("button", { onClick: $setup.goToReview }, "复习"),
        vue.createElementVNode("button", { onClick: $setup.goToMy }, "我的")
      ])
    ]);
  }
  const PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["render", _sfc_render$b], ["__scopeId", "data-v-1cf27b2a"], ["__file", "E:/vocal/wordbook_new/pages/index/index.vue"]]);
  const config = {
    // DeepSeek API Key，修改此处即可全局生效
    deepseekApiKey: "sk-c8ae8c792aa04c15960a0f5c7a38442c",
    // 请替换为你的新 API Key
    // 设为 false 时关闭所有 AI 请求（仅用于测试，避免误触发 API）
    aiServiceEnabled: true
  };
  class AIService {
    constructor() {
      this.apiKey = config.deepseekApiKey;
      this.apiUrl = "https://api.deepseek.com/v1/chat/completions";
    }
    async callAPI(prompt, model = "deepseek-chat") {
      formatAppLog("log", "at src/utils/aiService.js:14", "开始调用 API:", {
        model,
        prompt: prompt.substring(0, 50) + "...",
        url: this.apiUrl
      });
      return new Promise((resolve, reject) => {
        uni.request({
          url: this.apiUrl,
          method: "POST",
          header: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`
          },
          data: {
            model,
            messages: [
              {
                role: "system",
                content: "你是一个英语学习助手，帮助用户学习英语单词。"
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.6,
            // R1 建议设为 0.6 以获得更稳定的推理
            stream: false
          },
          success: (response) => {
            var _a;
            formatAppLog("log", "at src/utils/aiService.js:44", "API 响应状态:", response.statusCode);
            formatAppLog("log", "at src/utils/aiService.js:45", "API 响应数据:", response.data);
            if (response.statusCode === 200) {
              const data = response.data;
              if (data && data.choices && data.choices[0] && data.choices[0].message) {
                formatAppLog("log", "at src/utils/aiService.js:50", "API 调用成功，返回内容:", data.choices[0].message.content.substring(0, 100) + "...");
                resolve(data.choices[0].message.content);
              } else {
                formatAppLog("error", "at src/utils/aiService.js:53", "API 响应格式错误:", data);
                resolve("错误: API 响应格式错误");
              }
            } else {
              formatAppLog("error", "at src/utils/aiService.js:57", "API 报错:", response.data);
              resolve(`错误: ${((_a = response.data.error) == null ? void 0 : _a.message) || "未知错误"} (状态码: ${response.statusCode})`);
            }
          },
          fail: (error) => {
            formatAppLog("error", "at src/utils/aiService.js:62", "网络请求失败:", error);
            resolve("网络请求失败，请检查网络连接或API密钥");
          }
        });
      });
    }
    async analyzeWord(word) {
      const prompt = `请分析以下英语单词的语义，并推荐合适的标签（如"高频"、"作文词"、"口语词"、"学术词"等）：

单词：${word}

分析要求：
1. 简要解释单词的基本含义
2. 分析单词的使用场景和适用范围
3. 推荐2-3个合适的标签
4. 输出格式清晰，便于程序解析`;
      return await this.callAPI(prompt);
    }
    async generateExample(word, existingWords = []) {
      const existingWordsStr = existingWords.length > 0 ? `用户单词本中已有的其他单词（尽量使用这些单词来加强记忆）：${existingWords.join("、")}` : "用户单词本中暂无其他单词";
      const prompt = `请为以下英语单词生成一个例句，要求：

单词：${word}
${existingWordsStr}

例句要求：
1. 高级例句，包含高级单词
2. 句子不能过于冗长，结构清晰
3. 句子中包含2-3个考研词库中较难的单词
4. 例句要像考研的作文题和翻译题，贴近考研考纲
5. 尽量包含单词本中已有的其他单词，形成反复记忆的效果
6. 上下文合理，能够展示单词的正确用法
7. 提供中文翻译`;
      return await this.callAPI(prompt);
    }
    async generateMultipleExamples(word, existingWords = [], count = 3, examStatsText = "") {
      const existingWordsStr = existingWords.length > 0 ? `用户单词本中已有的其他单词（尽量使用这些单词来加强记忆）：${existingWords.join("、")}` : "用户单词本中暂无其他单词";
      const examBlock = examStatsText ? `

【该词在考研真题中的统计，供生成例句时参考】
${examStatsText}
` : "";
      const prompt = `请为以下英语单词生成${count}个不同的例句，要求：

单词：${word}
${existingWordsStr}${examBlock}

例句要求：
1. 高级例句，包含高级单词
2. 句子不能过于冗长，结构清晰
3. 每个句子中包含2-3个考研词库中较难的单词
4. 例句要像考研的作文题和翻译题，贴近考研考纲
5. 尽量包含单词本中已有的其他单词，形成反复记忆的效果
6. 上下文合理，能够展示单词的正确用法
7. 每个例句都要提供中文翻译
8. 确保每个例句的场景和结构都不同
9. 重要单词标记规则：
   - 目标单词必须用 ** 标记
   - 每个例句中至少标记2-3个其他考研核心词汇
   - 标记格式：**单词**，如 "**important**"
10. 例句要生动形象，贴近现实生活场景，内容有趣，容易记忆
11. 可以加入具体的场景描述，让例句更有画面感
12. 输出格式：每个例句一组，英文例句和中文翻译各占一行，不要使用任何分隔符

示例输出：
英文：在一个阳光明媚的周末，**significant** number of families gathered in the park, enjoying the **vibrant** flowers and **tranquil** atmosphere.
中文：在一个阳光明媚的周末，**大量**家庭聚集在公园里，欣赏着**鲜艳**的花朵和**宁静**的氛围。`;
      const result = await this.callAPI(prompt);
      const examples = [];
      const lines = result.split("\n").filter((line) => line.trim() !== "");
      for (let i2 = 0; i2 < lines.length; i2 += 2) {
        let english = lines[i2].trim();
        let chinese = lines[i2 + 1] ? lines[i2 + 1].trim() : "";
        english = english.replace(/^英文：?/, "").trim();
        english = english.replace(/^English：?/, "").trim();
        english = english.replace(/^:/, "").trim();
        chinese = chinese.replace(/^中文：?/, "").trim();
        chinese = chinese.replace(/^Chinese：?/, "").trim();
        chinese = chinese.replace(/^:/, "").trim();
        if (english) {
          examples.push({
            english,
            chinese
          });
        }
        if (examples.length >= count) {
          break;
        }
      }
      if (examples.length === 0) {
        for (let line of lines) {
          let parts = line.split("｜");
          if (parts.length !== 2) {
            parts = line.split("|");
          }
          if (parts.length === 2) {
            let english = parts[0].trim();
            let chinese = parts[1].trim();
            english = english.replace(/^英文：?/, "").trim();
            english = english.replace(/^English：?/, "").trim();
            english = english.replace(/^:/, "").trim();
            chinese = chinese.replace(/^中文：?/, "").trim();
            chinese = chinese.replace(/^Chinese：?/, "").trim();
            chinese = chinese.replace(/^:/, "").trim();
            examples.push({
              english,
              chinese
            });
          }
          if (examples.length >= count) {
            break;
          }
        }
      }
      if (examples.length === 0) {
        for (let i2 = 0; i2 < count; i2++) {
          examples.push({
            english: `Example ${i2 + 1}: This is a sentence with ${word}.`,
            chinese: `例句 ${i2 + 1}：这是一个包含 ${word} 的句子。`
          });
        }
      }
      return examples;
    }
    async generateReviewSuggestion(words) {
      if (words.length === 0) {
        return "单词本中暂无单词，建议开始添加单词进行学习。";
      }
      const wordStats = words.map((word) => {
        return {
          word: word.english,
          errorRate: word.error_rate || 0,
          reviewFreq: word.review_frequency || 0,
          viewCount: word.view_count || 0,
          importance: word.importance || 3
        };
      });
      const prompt = `请根据以下单词的学习数据，生成一段个性化的学习报告和建议：

单词学习数据：
${wordStats.map((w2) => `${w2.word} - 错误率: ${w2.errorRate}%, 复习频率: ${w2.reviewFreq}, 查看次数: ${w2.viewCount}, 重要性: ${w2.importance}星`).join("\n")}

报告要求：
1. 分析用户的学习情况
2. 指出需要重点关注的单词
3. 提供具体的学习建议
4. 给出合理的复习计划
5. 语言亲切自然，有针对性`;
      return await this.callAPI(prompt);
    }
    async generateAntonyms(word, count = 3) {
      var _a, _b, _c, _d;
      const prompt = `请为以下英语单词生成${count}个反义词，并为每个反义词生成一个例句。

单词：${word}

要求：
1. 选择${count}个最常见、最实用的反义词
2. 每个反义词需要包含：英文、中文释义、一个英文例句（带中文翻译）
3. 例句要像考研英语风格，包含高级词汇
4. 每个例句中用 ** 标记目标反义词和2-3个其他考研核心词汇
5. 输出格式：每组反义词包含4行：反义词、中文、英文例句、中文翻译

示例输出：
反义词：minor
中文：次要的，不重要的
例句：The **minor** issue was **overlooked** in the **initial** report.
中文翻译：这一**次要**问题在**最初**的报告中**被忽视**了。`;
      const result = await this.callAPI(prompt);
      const antonyms = [];
      const lines = (result || "").split(/\r?\n/).filter((line) => line.trim());
      for (let i2 = 0; i2 < lines.length; i2 += 4) {
        let antonym = ((_a = lines[i2]) == null ? void 0 : _a.replace(/^反义词：?/, "").trim()) || "";
        let chinese = ((_b = lines[i2 + 1]) == null ? void 0 : _b.replace(/^中文：?/, "").trim()) || "";
        let example = ((_c = lines[i2 + 2]) == null ? void 0 : _c.replace(/^例句：?/, "").trim()) || "";
        let exampleChinese = ((_d = lines[i2 + 3]) == null ? void 0 : _d.replace(/^中文翻译：?/, "").trim()) || "";
        if (antonym && chinese) {
          antonyms.push({
            antonym,
            chinese,
            example: example || "",
            exampleChinese: exampleChinese || ""
          });
        }
        if (antonyms.length >= count)
          break;
      }
      if (antonyms.length === 0) {
        for (let i2 = 0; i2 < count; i2++) {
          antonyms.push({
            antonym: `antonym${i2 + 1}`,
            chinese: "反义词",
            example: "",
            exampleChinese: ""
          });
        }
      }
      return antonyms;
    }
    async generateSynonyms(word, existingWords = [], count = 3) {
      var _a, _b, _c, _d;
      const existingWordsStr = existingWords.length > 0 ? `用户单词本中已有的其他单词：${existingWords.join("、")}` : "用户单词本中暂无其他单词";
      const prompt = `请为以下英语单词生成${count}个近义词或同义词，并为每个近义词生成一个例句。

单词：${word}
${existingWordsStr}

要求：
1. 选择3个最常见、最实用的近义词或同义词
2. 每个近义词需要包含：英文、中文释义、一个英文例句（带中文翻译）
3. 例句要像考研英语风格，包含高级词汇
4. 每个例句中用 **标记目标近义词和2-3个其他考研核心词汇
5. 输出格式：每组近义词包含4行：近义词、中文、英文例句、中文翻译

示例输出：
近义词：significant
中文：重要的，重大的
例句：The **significant** discovery changed the **entire** scientific community's understanding of **ancient** civilizations.
中文翻译：这一**重大**发现改变了**整个**科学界对**古代**文明的理解。`;
      const result = await this.callAPI(prompt);
      const synonyms = [];
      const lines = result.split("\n").filter((line) => line.trim() !== "");
      for (let i2 = 0; i2 < lines.length; i2 += 4) {
        let synonym = ((_a = lines[i2]) == null ? void 0 : _a.replace(/^近义词：?/, "").trim()) || "";
        let chinese = ((_b = lines[i2 + 1]) == null ? void 0 : _b.replace(/^中文：?/, "").trim()) || "";
        let example = ((_c = lines[i2 + 2]) == null ? void 0 : _c.replace(/^例句：?/, "").trim()) || "";
        let exampleChinese = ((_d = lines[i2 + 3]) == null ? void 0 : _d.replace(/^中文翻译：?/, "").trim()) || "";
        if (synonym && chinese) {
          synonyms.push({
            synonym,
            chinese,
            example: example || "",
            exampleChinese: exampleChinese || ""
          });
        }
        if (synonyms.length >= count) {
          break;
        }
      }
      if (synonyms.length === 0) {
        for (let i2 = 0; i2 < count; i2++) {
          synonyms.push({
            synonym: `synonym${i2 + 1}`,
            chinese: `近义词${i2 + 1}`,
            example: `Example with ${word}.`,
            exampleChinese: `例句翻译${i2 + 1}`
          });
        }
      }
      return synonyms;
    }
    async generateExamplesAndSynonyms(word, existingWords = [], examStatsText = "") {
      const existingWordsStr = existingWords.length > 0 ? `用户单词本中已有的其他单词（尽量使用这些单词来加强记忆）：${existingWords.join("、")}` : "用户单词本中暂无其他单词";
      const examBlock = examStatsText ? `

【该词在考研真题中的统计，供生成例句时参考】
${examStatsText}
` : "";
      const prompt = `请为以下英语单词生成3个不同的例句，同时提供3个常用近义词，每个近义词需包含例句。

单词：${word}
${existingWordsStr}${examBlock}

=== 第一部分：例句要求 ===
1. 高级例句，包含高级单词
2. 句子不能过于冗长，结构清晰
3. 每个句子中包含2-3个考研词库中较难的单词
4. 例句要像考研的作文题和翻译题，贴近考研考纲
5. 尽量包含单词本中已有的其他单词，形成反复记忆的效果
6. 上下文合理，能够展示单词的正确用法
7. 每个例句都要提供中文翻译
8. 确保每个例句的场景和结构都不同
9. 重要单词标记规则：
   - 目标单词必须用 ** 标记
   - 每个例句中至少标记2-3个其他考研核心词汇
   - 标记格式：**单词**，如 "**important**"
10. 例句要生动形象，贴近现实生活场景，内容有趣，容易记忆
11. 可以加入具体的场景描述，让例句更有画面感

=== 第二部分：近义词要求 ===
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
      formatAppLog("log", "at src/utils/aiService.js:301", "AI返回的原始内容:", result);
      try {
        let jsonStr = result;
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
        let parsed;
        try {
          parsed = JSON.parse(jsonStr);
        } catch (e1) {
          jsonStr = jsonStr.replace(/"word":/g, '"synonym":').replace(/"translation":/g, '"chinese":');
          try {
            parsed = JSON.parse(jsonStr);
          } catch (e2) {
            formatAppLog("error", "at src/utils/aiService.js:321", "替换字段名后仍解析失败:", e2);
            return { examples: [], synonyms: [] };
          }
        }
        formatAppLog("log", "at src/utils/aiService.js:326", "解析后的JSON:", parsed);
        const normalizedSynonyms = (parsed.synonyms || []).map((item) => ({
          synonym: item.synonym || item.word || "",
          chinese: item.chinese || item.translation || "",
          example: item.example || "",
          exampleChinese: item.exampleChinese || ""
        }));
        return {
          examples: parsed.examples || [],
          synonyms: normalizedSynonyms
        };
      } catch (e2) {
        formatAppLog("error", "at src/utils/aiService.js:341", "解析JSON失败:", e2);
      }
      return {
        examples: [],
        synonyms: []
      };
    }
    async generateSynonymContrast(word, synonyms = []) {
      const synonymText = Array.isArray(synonyms) && synonyms.length ? synonyms.map((item) => `${item.synonym || ""}(${item.chinese || ""})`).filter(Boolean).join("、") : "暂无近义词";
      const prompt = `请为英语单词 ${word} 生成一段简洁的近义词辨析说明。
已知近义词：${synonymText}
要求：
1. 重点说明语气、正式度、常见搭配或适用语境差异
2. 控制在 2-4 句
3. 用中文输出，适合考研背单词场景`;
      const result = await this.callAPI(prompt);
      return String(result || "").trim();
    }
    async generateWordFamily(word) {
      const prompt = `请为英语单词 ${word} 生成词族与搭配学习卡。严格返回 JSON，不要 Markdown。
格式：{"derivatives":[{"word":"派生词","chinese":"中文","hint":"简短提示"}],"collocations":[{"phrase":"搭配","chinese":"中文"}],"memory_tip":"一句话记忆提示"}
要求：
1. derivatives 返回 3-5 个高价值派生词或同词根词
2. collocations 返回 3-5 个常见搭配
3. 内容偏考研英语高频场景`;
      const result = await this.callAPI(prompt);
      try {
        const jsonMatch = String(result || "").match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : result);
        return {
          derivatives: Array.isArray(parsed.derivatives) ? parsed.derivatives : [],
          collocations: Array.isArray(parsed.collocations) ? parsed.collocations : [],
          memory_tip: parsed.memory_tip || ""
        };
      } catch (_2) {
        return { derivatives: [], collocations: [], memory_tip: "" };
      }
    }
  }
  const aiService = new AIService();
  const SECTION_ORDER = ["完形", "阅读", "新题型", "翻译", "写作", "完整试卷"];
  function formatWordStatsForPrompt(stats) {
    if (!stats || typeof stats !== "object")
      return "";
    const total = stats.total_count || 0;
    const by = stats.by_section || {};
    const parts = SECTION_ORDER.filter((s2) => by[s2] > 0).map((s2) => `${s2}${by[s2]}次`);
    const years = stats.years && stats.years.length ? stats.years : [];
    const yearStr = years.length > 0 ? `，出现年份：${years.slice(0, 5).join("、")}${years.length > 5 ? "等" + years.length + "年" : ""}` : "";
    return `该词在考研真题中的统计：总出现${total}次；按题型：${parts.join("、") || "无"}${yearStr}。生成例句时可参考其真题考查频率与题型分布。`;
  }
  const _sfc_main$a = {
    __name: "word-detail",
    setup(__props, { expose: __expose }) {
      __expose();
      const word = vue.ref({
        english: "",
        chinese: "",
        tags: "",
        source_page: "",
        year: "",
        importance: 3,
        // 默认三星
        error_rate: 0,
        review_frequency: 0,
        repeat_count: 1,
        examples: [],
        synonyms: [],
        antonyms: [],
        defs: [],
        exam_tip: "",
        sentiment: "neu"
      });
      const POS_BREAK_REGEX = new RegExp("(?<!\\n)(vi[.\\．。]|vt[.\\．。]|adj[.\\．。]|adv[.\\．。]|prep[.\\．。]|conj[.\\．。]|pron[.\\．。]|num[.\\．。]|int[.\\．。]|aux[.\\．。]|art[.\\．。]|[nva][.\\．。])", "gi");
      function addNewlineBeforePos(chineseText) {
        if (!chineseText || typeof chineseText !== "string")
          return chineseText;
        const s2 = chineseText.replace(POS_BREAK_REGEX, "\n$1");
        return s2.replace(/^\n/, "");
      }
      vue.watch(() => word.value.chinese, (newValue) => {
        if (newValue) {
          let processedValue = addNewlineBeforePos(newValue);
          if (processedValue !== newValue) {
            word.value.chinese = processedValue;
          }
        }
      });
      const example = vue.ref("");
      const synonymLoading = vue.ref(false);
      const synonymContrastLoading = vue.ref(false);
      const antonymLoading = vue.ref(false);
      const synonymContrastText = vue.ref("");
      const wordFamilyLoading = vue.ref(false);
      const wordFamily = vue.ref({ derivatives: [], collocations: [], memory_tip: "" });
      const sameTagWords = vue.ref([]);
      const wordId = vue.ref("");
      const fromWordbookMode = vue.ref(false);
      const examStats = vue.ref(null);
      const examStatsTags = vue.ref([]);
      const examStatsLoading = vue.ref(false);
      const examSentences = vue.ref([]);
      const examSentencesLoading = vue.ref(false);
      const showAllExamSentences = vue.ref(false);
      const detailHeavyLoading = vue.ref(false);
      let examFallbackTimer = null;
      function clearExamFallbackTimer() {
        if (examFallbackTimer) {
          clearTimeout(examFallbackTimer);
          examFallbackTimer = null;
        }
      }
      function scheduleExamDataFallback(english, currentWordId, delay = 180) {
        clearExamFallbackTimer();
        examFallbackTimer = setTimeout(() => {
          examFallbackTimer = null;
          loadExamDataLazy(english, currentWordId);
        }, delay);
      }
      const SECTION_ORDER2 = ["完形", "阅读", "新题型", "翻译", "写作", "完整试卷", "未分类"];
      const examStatsBySection = vue.computed(() => {
        if (!examStats.value || !examStats.value.by_section)
          return "-";
        const by = examStats.value.by_section;
        return SECTION_ORDER2.filter((s2) => (by[s2] || 0) > 0).map((s2) => `${s2}${by[s2]}次`).join("；") || "-";
      });
      const examStatsYears = vue.computed(() => {
        if (!examStats.value || !Array.isArray(examStats.value.years) || !examStats.value.years.length)
          return "";
        return examStats.value.years.join("、");
      });
      const displayExamSentences = vue.computed(() => {
        const list = examSentences.value || [];
        if (showAllExamSentences.value)
          return list;
        return list.slice(0, 3);
      });
      const displayWordTags = vue.computed(() => {
        const tags = (word.value.tags || "").split(/[,，\s]+/).map((item) => item.trim()).filter(Boolean);
        return [...new Set(tags)];
      });
      const sentimentLabel = vue.computed(() => {
        const map = { pos: "褒义色彩", neg: "贬义色彩", neu: "" };
        return map[word.value.sentiment] || "";
      });
      const examQuizSelected = vue.ref(null);
      const examQuizSentence = vue.computed(() => {
        const sentence = displayExamSentences.value[0] && displayExamSentences.value[0].sentence || "";
        if (!sentence || !word.value.english)
          return sentence;
        return sentence.replace(new RegExp(`\\b${escapeRegExp(word.value.english)}\\b`, "gi"), "____");
      });
      const examQuizAnswerIndex = vue.computed(() => {
        const defs = Array.isArray(word.value.defs) ? word.value.defs : [];
        const freqIndex = defs.findIndex((item) => getDefType(item) === "freq");
        if (freqIndex >= 0)
          return freqIndex;
        const rareIndex = defs.findIndex((item) => getDefType(item) === "rare");
        if (rareIndex >= 0)
          return rareIndex;
        return defs.length ? 0 : -1;
      });
      const examQuizAnswerText = vue.computed(() => {
        const defs = Array.isArray(word.value.defs) ? word.value.defs : [];
        const answer = defs[examQuizAnswerIndex.value];
        if (!answer)
          return "暂无可推荐义项";
        return `${getDefTypeLabel(answer) || "推荐义项"} · ${answer.pos || ""} ${answer.trans || ""}`;
      });
      const loadExtraPanels = () => {
        var _a, _b, _c;
        const extra = getWordExtra(word.value.english);
        synonymContrastText.value = extra.synonymContrastText || "";
        wordFamily.value = {
          derivatives: Array.isArray((_a = extra.wordFamily) == null ? void 0 : _a.derivatives) ? extra.wordFamily.derivatives : [],
          collocations: Array.isArray((_b = extra.wordFamily) == null ? void 0 : _b.collocations) ? extra.wordFamily.collocations : [],
          memory_tip: ((_c = extra.wordFamily) == null ? void 0 : _c.memory_tip) || ""
        };
      };
      const loadWordFromMasterDb = async (english) => {
        if (!english)
          return;
        word.value = {
          english,
          chinese: "加载中…",
          tags: "",
          source_page: "",
          year: "",
          importance: 0,
          error_rate: 0,
          review_frequency: 0,
          repeat_count: 0,
          examples: [],
          synonyms: [],
          antonyms: [],
          defs: [],
          exam_tip: "",
          sentiment: "neu"
        };
        detailHeavyLoading.value = true;
        examStatsLoading.value = true;
        examSentencesLoading.value = true;
        try {
          const detail = await getWordFullDetail(english);
          if (!detail || word.value.english !== english)
            return;
          const wordDefs = Array.isArray(detail.defs) ? detail.defs : [];
          const examples = Array.isArray(detail.examples) ? detail.examples : [];
          const synonyms = Array.isArray(detail.synonyms) ? detail.synonyms : [];
          const antonyms = Array.isArray(detail.antonyms) ? detail.antonyms : [];
          const examTip = detail.exam_tip || "";
          const wordSentiment = detail.sentiment || "neu";
          word.value = {
            ...word.value,
            chinese: detail.chinese || "",
            examples,
            synonyms,
            antonyms,
            importance: detail.examStats && detail.examStats.importance != null ? detail.examStats.importance : 0,
            defs: wordDefs,
            exam_tip: examTip,
            sentiment: wordSentiment
          };
          if (detail.examStats) {
            examStats.value = detail.examStats;
            examStatsTags.value = Array.isArray(detail.examStats.tags) ? detail.examStats.tags : [];
            if (examStatsTags.value.length > 0)
              word.value = { ...word.value, tags: examStatsTags.value.join(",") };
          }
          examSentences.value = Array.isArray(detail.examSentences) ? detail.examSentences : [];
        } catch (e2) {
          formatAppLog("error", "at pages/word-detail/word-detail.vue:528", "[详情页-masterdb] 加载失败:", e2);
          word.value.chinese = "";
        } finally {
          detailHeavyLoading.value = false;
          examStatsLoading.value = false;
          examSentencesLoading.value = false;
        }
      };
      const normalizeDefType2 = (rawType) => {
        const value = String(rawType || "").trim().toLowerCase();
        if (!value)
          return "normal";
        if ([
          "freq",
          "important",
          "important_meaning",
          "importantmeaning",
          "重点",
          "重点义",
          "重要",
          "重要义",
          "重要意思",
          "常考",
          "高频"
        ].includes(value)) {
          return "freq";
        }
        if ([
          "rare",
          "rare_meaning",
          "raremeaning",
          "僻义",
          "熟词僻义",
          "熟词生义",
          "生义"
        ].includes(value)) {
          return "rare";
        }
        return "normal";
      };
      const getDefType = (item) => normalizeDefType2(item == null ? void 0 : item.type);
      const getDefTypeLabel = (item) => {
        const type = getDefType(item);
        if (type === "freq")
          return "重要义";
        if (type === "rare")
          return "熟词僻义";
        return "";
      };
      const getLastWordInfo = async () => {
        const lastWord = await db.getLastWord();
        if (lastWord) {
          word.value.source_page = lastWord.source_page || "";
          word.value.year = lastWord.year || "";
        }
      };
      function loadExamDataLazy(english, currentWordId) {
        const isSelf = currentWordId != null;
        const guard = () => {
          var _a, _b;
          return isSelf ? ((_a = word.value) == null ? void 0 : _a.id) !== currentWordId : ((_b = word.value) == null ? void 0 : _b.english) !== english;
        };
        examStatsLoading.value = true;
        examSentencesLoading.value = true;
        showAllExamSentences.value = false;
        getWordExamData(english).then((data) => {
          if (guard())
            return;
          const stats = (data == null ? void 0 : data.examStats) || null;
          const list = (data == null ? void 0 : data.examSentences) || [];
          if (guard())
            return;
          if (stats) {
            examStats.value = stats;
            examStatsTags.value = Array.isArray(stats.tags) ? stats.tags : [];
            word.value = { ...word.value, importance: typeof stats.importance === "number" ? stats.importance : 0 };
            if (examStatsTags.value.length > 0)
              word.value = { ...word.value, tags: examStatsTags.value.join(",") };
          } else {
            examStats.value = null;
            examStatsTags.value = [];
            if (isSelf)
              word.value = { ...word.value, importance: 0 };
          }
          examSentences.value = Array.isArray(list) ? list : [];
        }).catch(() => {
          examStats.value = null;
          examSentences.value = [];
        }).finally(() => {
          examStatsLoading.value = false;
          examSentencesLoading.value = false;
        });
      }
      const loadWordFromWordbook = (english) => {
        fromWordbookMode.value = true;
        detailHeavyLoading.value = true;
        showAllExamSentences.value = false;
        examStatsLoading.value = true;
        examSentencesLoading.value = true;
        word.value = {
          ...word.value,
          english,
          chinese: "加载中…",
          importance: 0,
          examples: [],
          synonyms: [],
          antonyms: [],
          defs: [],
          exam_tip: "",
          sentiment: "neu"
        };
        loadExtraPanels();
        getWordFullDetail(english).then((detail) => {
          formatAppLog("log", "at pages/word-detail/word-detail.vue:643", "[详情页] getWordFullDetail 回调执行, detail=", detail ? "有数据" : "null");
          detailHeavyLoading.value = false;
          examStatsLoading.value = false;
          examSentencesLoading.value = false;
          if (word.value.english !== english)
            return;
          if (detail) {
            let examples = Array.isArray(detail.examples) ? detail.examples : [];
            let synonyms = Array.isArray(detail.synonyms) ? detail.synonyms : [];
            let antonyms = Array.isArray(detail.antonyms) ? detail.antonyms : [];
            let wordDefs = Array.isArray(detail.defs) && detail.defs.length ? detail.defs : [];
            let examTip = typeof detail.exam_tip === "string" ? detail.exam_tip : "";
            let wordSentiment = detail.sentiment === "pos" || detail.sentiment === "neg" || detail.sentiment === "neu" ? detail.sentiment : "neu";
            if (!wordDefs.length && detail.data_json != null) {
              try {
                const rawData = typeof detail.data_json === "string" ? JSON.parse(detail.data_json || "{}") : detail.data_json || {};
                if (Array.isArray(rawData.defs) && rawData.defs.length)
                  wordDefs = rawData.defs;
                if (!examTip && typeof rawData.exam_tip === "string")
                  examTip = rawData.exam_tip;
                if (wordSentiment === "neu" && (rawData.sentiment === "pos" || rawData.sentiment === "neg"))
                  wordSentiment = rawData.sentiment;
              } catch (_2) {
              }
            }
            word.value = {
              ...word.value,
              chinese: detail.chinese || word.value.chinese,
              examples,
              synonyms,
              antonyms,
              importance: detail.examStats && detail.examStats.importance != null ? detail.examStats.importance : 0,
              defs: wordDefs,
              exam_tip: examTip,
              sentiment: wordSentiment
            };
            if (word.value.chinese === "加载中…")
              word.value = { ...word.value, chinese: detail.chinese || "" };
            examStats.value = detail.examStats;
            examSentences.value = Array.isArray(detail.examSentences) ? detail.examSentences : [];
            examStatsTags.value = detail.examStats && Array.isArray(detail.examStats.tags) ? detail.examStats.tags : [];
            if (examStatsTags.value.length > 0)
              word.value = { ...word.value, tags: examStatsTags.value.join(",") };
            formatAppLog("log", "at pages/word-detail/word-detail.vue:681", "[详情页] 已赋值 examples.length=", examples.length);
            const needPregen = examples.length === 0 && synonyms.length === 0 && antonyms.length === 0;
            if (needPregen) {
              getPregenWord(english).then((pregen) => {
                if (word.value.english !== english)
                  return;
                if (pregen && (Array.isArray(pregen.examples) && pregen.examples.length > 0 || Array.isArray(pregen.synonyms) && pregen.synonyms.length > 0 || Array.isArray(pregen.antonyms) && pregen.antonyms.length > 0)) {
                  const ex = Array.isArray(pregen.examples) && pregen.examples.length > 0 ? pregen.examples : word.value.examples;
                  const sy = Array.isArray(pregen.synonyms) && pregen.synonyms.length > 0 ? pregen.synonyms : word.value.synonyms;
                  const an = Array.isArray(pregen.antonyms) && pregen.antonyms.length > 0 ? pregen.antonyms : word.value.antonyms;
                  word.value = { ...word.value, examples: ex, synonyms: sy, antonyms: an };
                  if (!word.value.chinese && pregen.chinese)
                    word.value = { ...word.value, chinese: pregen.chinese };
                  formatAppLog("log", "at pages/word-detail/word-detail.vue:693", "[详情页] 已从 pregen 补全 例句/近义/反义");
                }
              });
            }
          } else {
            if (word.value.chinese === "加载中…")
              word.value = { ...word.value, chinese: "" };
            examStats.value = null;
            examSentences.value = [];
            getPregenWord(english).then((pregen) => {
              if (word.value.english !== english || !pregen)
                return;
              const ex = Array.isArray(pregen.examples) ? pregen.examples : [];
              const sy = Array.isArray(pregen.synonyms) ? pregen.synonyms : [];
              const an = Array.isArray(pregen.antonyms) ? pregen.antonyms : [];
              word.value = {
                ...word.value,
                chinese: (pregen.chinese || word.value.chinese || "").trim() || word.value.chinese,
                examples: ex,
                synonyms: sy,
                antonyms: an
              };
              if (ex.length || sy.length || an.length)
                formatAppLog("log", "at pages/word-detail/word-detail.vue:714", "[详情页] 已从 pregen 补全(主库无该词)");
            });
          }
        }).catch((e2) => {
          formatAppLog("error", "at pages/word-detail/word-detail.vue:718", "[详情页] getWordFullDetail catch", e2);
          detailHeavyLoading.value = false;
          examStatsLoading.value = false;
          examSentencesLoading.value = false;
          if (word.value.chinese === "加载中…")
            word.value = { ...word.value, chinese: "" };
        });
      };
      const loadWord = async () => {
        const id = wordId.value;
        const t0 = Date.now();
        formatAppLog("log", "at pages/word-detail/word-detail.vue:729", "[详情-自用] 入口 id=", id, "t0=", t0);
        clearExamFallbackTimer();
        const tLight = Date.now();
        const result = await db.getWordByIdLight(id);
        formatAppLog("log", "at pages/word-detail/word-detail.vue:734", "[详情-自用] getWordByIdLight", Date.now() - tLight, "ms");
        if (!result)
          return;
        if (result.chinese)
          result.chinese = addNewlineBeforePos(result.chinese);
        word.value = result;
        loadExtraPanels();
        db.incrementViewCount(id);
        increaseRepeatCount();
        const tSameTag = Date.now();
        loadSameTagWords();
        formatAppLog("log", "at pages/word-detail/word-detail.vue:745", "[详情-自用] loadSameTagWords 已触发(未await)", Date.now() - tSameTag, "ms");
        const english = result.english;
        showAllExamSentences.value = false;
        examStatsLoading.value = true;
        examSentencesLoading.value = true;
        examStats.value = null;
        examStatsTags.value = [];
        examSentences.value = [];
        const tHeavy = Date.now();
        db.getWordByIdHeavy(id).then((heavy) => {
          var _a;
          formatAppLog("log", "at pages/word-detail/word-detail.vue:757", "[详情-自用] getWordByIdHeavy", Date.now() - tHeavy, "ms");
          if (!heavy || ((_a = word.value) == null ? void 0 : _a.id) !== id)
            return;
          word.value = {
            ...word.value,
            examples: heavy.examples || [],
            synonyms: heavy.synonyms || [],
            antonyms: heavy.antonyms || []
          };
          formatAppLog("log", "at pages/word-detail/word-detail.vue:765", "[详情-自用] 重型字段补全完成", Date.now() - t0, "ms");
        });
        getWordFullDetail(english).then((detail) => {
          var _a;
          if (((_a = word.value) == null ? void 0 : _a.id) !== id)
            return;
          if (!detail) {
            scheduleExamDataFallback(english, id);
            return;
          }
          const needChinese = !(word.value.chinese || "").trim();
          const needExamples = !Array.isArray(word.value.examples) || word.value.examples.length === 0;
          const needSynonyms = !Array.isArray(word.value.synonyms) || word.value.synonyms.length === 0;
          const needAntonyms = !Array.isArray(word.value.antonyms) || word.value.antonyms.length === 0;
          const detailExamStats = detail.examStats && typeof detail.examStats === "object" ? detail.examStats : null;
          const detailExamSentences = Array.isArray(detail.examSentences) ? detail.examSentences : [];
          const detailDefs = Array.isArray(detail.defs) ? detail.defs : [];
          const detailExamTip = typeof detail.exam_tip === "string" ? detail.exam_tip : "";
          const detailSentiment = detail.sentiment === "pos" || detail.sentiment === "neg" || detail.sentiment === "neu" ? detail.sentiment : word.value.sentiment;
          const hasExamStats = !!detailExamStats;
          const hasExamSentences = detailExamSentences.length > 0;
          if (!needChinese && !needExamples && !needSynonyms && !needAntonyms && hasExamStats && hasExamSentences) {
            word.value = {
              ...word.value,
              chinese: (detail.chinese || "").trim() || word.value.chinese,
              defs: detailDefs,
              exam_tip: detailExamTip,
              sentiment: detailSentiment
            };
            examStats.value = detailExamStats;
            examSentences.value = detailExamSentences;
            examStatsTags.value = Array.isArray(detailExamStats.tags) ? detailExamStats.tags : [];
            examStatsLoading.value = false;
            examSentencesLoading.value = false;
            return;
          }
          word.value = {
            ...word.value,
            chinese: (detail.chinese || "").trim() || word.value.chinese,
            examples: needExamples ? detail.examples || [] : word.value.examples,
            synonyms: needSynonyms ? detail.synonyms || [] : word.value.synonyms,
            antonyms: needAntonyms ? detail.antonyms || [] : word.value.antonyms,
            defs: detailDefs.length ? detailDefs : word.value.defs,
            exam_tip: detailExamTip || word.value.exam_tip,
            sentiment: detailSentiment
          };
          if (hasExamStats) {
            examStats.value = detailExamStats;
            examStatsTags.value = Array.isArray(detailExamStats.tags) ? detailExamStats.tags : [];
            word.value.importance = typeof detailExamStats.importance === "number" ? detailExamStats.importance : 0;
            if (examStatsTags.value.length > 0)
              word.value.tags = examStatsTags.value.join(",");
          } else {
            examStats.value = null;
            examStatsTags.value = [];
          }
          if (hasExamSentences)
            examSentences.value = detailExamSentences;
          else
            examSentences.value = [];
          examStatsLoading.value = !hasExamStats;
          examSentencesLoading.value = !hasExamSentences;
          if (!hasExamStats || !hasExamSentences) {
            scheduleExamDataFallback(english, id);
          }
        }).catch(() => {
          scheduleExamDataFallback(english, id);
        });
        getPregenWord(english).then((pre) => {
          var _a;
          if (!pre || ((_a = word.value) == null ? void 0 : _a.id) !== id)
            return;
          const needChinese = !(word.value.chinese || "").trim();
          const needExamples = !Array.isArray(word.value.examples) || word.value.examples.length === 0;
          const needSynonyms = !Array.isArray(word.value.synonyms) || word.value.synonyms.length === 0;
          const needAntonyms = !Array.isArray(word.value.antonyms) || word.value.antonyms.length === 0;
          if (!needChinese && !needExamples && !needSynonyms && !needAntonyms)
            return;
          word.value = {
            ...word.value,
            chinese: needChinese ? (pre.chinese || "").trim() || word.value.chinese : word.value.chinese,
            examples: needExamples ? pre.examples || [] : word.value.examples,
            synonyms: needSynonyms ? pre.synonyms || [] : word.value.synonyms,
            antonyms: needAntonyms ? pre.antonyms || [] : word.value.antonyms
          };
        }).catch(() => {
        });
      };
      const retryLoadExamStats = async () => {
        if (!word.value || !word.value.english)
          return;
        examStatsLoading.value = true;
        examSentencesLoading.value = true;
        try {
          const data = await getWordExamData(word.value.english);
          const stats = (data == null ? void 0 : data.examStats) || null;
          if (stats) {
            examStats.value = stats;
            examStatsTags.value = Array.isArray(stats.tags) ? stats.tags : [];
            word.value.importance = typeof stats.importance === "number" ? stats.importance : 0;
            if (examStatsTags.value.length > 0) {
              word.value.tags = examStatsTags.value.join(",");
            }
          } else {
            examStats.value = null;
            examStatsTags.value = [];
            word.value.importance = 0;
          }
          examSentences.value = Array.isArray(data == null ? void 0 : data.examSentences) ? data.examSentences : [];
        } catch (e2) {
          examStats.value = null;
          examStatsTags.value = [];
          examSentences.value = [];
        } finally {
          examStatsLoading.value = false;
          examSentencesLoading.value = false;
        }
      };
      const loadSameTagWords = async () => {
        const tags = (word.value.tags || "").split(/[,，\s]+/).map((t2) => t2.trim()).filter(Boolean);
        if (tags.length === 0) {
          sameTagWords.value = [];
          return;
        }
        sameTagWords.value = await db.getWordsByTag(tags[0], wordId.value);
      };
      const goToWord = (id) => {
        uni.navigateTo({ url: `/pages/word-detail/word-detail?id=${id}` });
      };
      const selectExamQuiz = (idx) => {
        examQuizSelected.value = idx;
      };
      const goBack = () => {
        uni.navigateBack();
      };
      const applyTag = (tag) => {
        const cur = (word.value.tags || "").trim();
        const list = cur ? cur.split(/[,，\s]+/).map((t2) => t2.trim()).filter(Boolean) : [];
        if (list.includes(tag))
          return;
        word.value.tags = list.concat(tag).join(",");
      };
      onLoad((options) => {
        formatAppLog("log", "at pages/word-detail/word-detail.vue:908", "onLoad 获取到的参数:", options);
        if (options && options.id) {
          wordId.value = options.id;
          loadWord();
        } else if (options && options.english && options.source === "masterdb") {
          wordId.value = "";
          fromWordbookMode.value = true;
          loadWordFromMasterDb(decodeURIComponent(options.english));
        } else if (options && options.english && options.fromWordbook === "1") {
          wordId.value = "";
          loadWordFromWordbook(decodeURIComponent(options.english));
        } else {
          getLastWordInfo();
        }
      });
      vue.onMounted(() => {
        uni.$on("wordEnriched", onWordEnriched);
      });
      const onWordEnriched = (id) => {
        if (id && wordId.value === id)
          loadWord();
      };
      onUnload(() => {
        uni.$off("wordEnriched", onWordEnriched);
        clearExamFallbackTimer();
        try {
          cleanupExpiredCaches();
        } catch (error) {
          logger.warn("WordDetail", "清理缓存失败", error);
        }
      });
      const save = async () => {
        if (!word.value.english || !word.value.chinese) {
          uni.showToast({
            title: "请填写英文和中文",
            duration: 2e3
          });
          return;
        }
        if (wordId.value) {
          await db.updateWord(wordId.value, word.value);
        } else {
          await db.addWord(word.value);
        }
        uni.showToast({
          title: wordId.value ? "更新成功" : "添加成功",
          duration: 2e3
        });
        uni.navigateBack();
      };
      const cancel = () => {
        uni.navigateBack();
      };
      const deleteWord = async () => {
        uni.showModal({
          title: "确认删除",
          content: "确定要删除这个单词吗？",
          success: async (res) => {
            if (res.confirm) {
              await db.deleteWord(wordId.value);
              uni.showToast({
                title: "删除成功",
                duration: 2e3
              });
              uni.navigateBack();
            }
          }
        });
      };
      const editWord = () => {
        uni.showToast({
          title: "编辑模式",
          duration: 1e3
        });
      };
      const generateExample = async () => {
        if (!word.value.english) {
          uni.showToast({
            title: "请输入英文单词",
            duration: 2e3
          });
          return;
        }
        try {
          const pregen = await getPregenWord(word.value.english);
          if (pregen && Array.isArray(pregen.examples) && pregen.examples.length > 0) {
            word.value.examples = pregen.examples;
            if (wordId.value) {
              await db.updateWord(wordId.value, { examples: pregen.examples });
            }
            uni.showToast({ title: "已从本地词库加载例句", duration: 2e3 });
            return;
          }
          const words = await db.getWordsForList(10, 0, "create_time", "desc", {});
          const existingWords = words.filter((w2) => w2.english !== word.value.english).map((w2) => w2.english).slice(0, 10);
          example.value = "生成中...";
          let examText = "";
          try {
            const examData = await getWordExamData(word.value.english);
            if (examData == null ? void 0 : examData.examStats)
              examText = formatWordStatsForPrompt(examData.examStats);
          } catch (_2) {
          }
          const examples = await aiService.generateMultipleExamples(word.value.english, existingWords, 3, examText);
          word.value.examples = examples;
          example.value = "";
          if (wordId.value) {
            await db.updateWord(wordId.value, { examples });
            uni.showToast({
              title: "例句已更新",
              duration: 2e3
            });
          } else {
            uni.showToast({
              title: "例句已生成",
              duration: 2e3
            });
          }
        } catch (error) {
          formatAppLog("error", "at pages/word-detail/word-detail.vue:1048", "生成例句失败:", error);
          example.value = "生成例句失败，请重试";
        }
      };
      const generateSynonyms = async () => {
        if (!word.value.english) {
          uni.showToast({
            title: "请输入英文单词",
            duration: 2e3
          });
          return;
        }
        try {
          synonymLoading.value = true;
          const pregen = await getPregenWord(word.value.english);
          if (pregen && Array.isArray(pregen.synonyms) && pregen.synonyms.length > 0) {
            word.value.synonyms = pregen.synonyms;
            if (wordId.value) {
              await db.updateWord(wordId.value, { synonyms: pregen.synonyms });
            }
            uni.showToast({ title: "已从本地词库加载近义词", duration: 2e3 });
            return;
          }
          const words = await db.getWordsForList(10, 0, "create_time", "desc", {});
          const existingWords = words.filter((w2) => w2.english !== word.value.english).map((w2) => w2.english).slice(0, 10);
          const synonyms = await aiService.generateSynonyms(word.value.english, existingWords, 3);
          word.value.synonyms = synonyms;
          if (wordId.value) {
            await db.updateWord(wordId.value, { synonyms });
            uni.showToast({
              title: "近义词已更新",
              duration: 2e3
            });
          } else {
            uni.showToast({
              title: "近义词已生成",
              duration: 2e3
            });
          }
        } catch (error) {
          formatAppLog("error", "at pages/word-detail/word-detail.vue:1097", "生成近义词失败:", error);
          uni.showToast({
            title: "生成近义词失败，请重试",
            duration: 2e3
          });
        } finally {
          synonymLoading.value = false;
        }
      };
      const generateSynonymContrast = async () => {
        if (!word.value.english)
          return;
        try {
          synonymContrastLoading.value = true;
          const text = await aiService.generateSynonymContrast(word.value.english, word.value.synonyms || []);
          synonymContrastText.value = text || "";
          saveWordExtra(word.value.english, { synonymContrastText: synonymContrastText.value });
          if (synonymContrastText.value) {
            uni.showToast({ title: "辨析已生成", icon: "none" });
          }
        } catch (_2) {
          uni.showToast({ title: "生成辨析失败", icon: "none" });
        } finally {
          synonymContrastLoading.value = false;
        }
      };
      const generateAntonyms = async () => {
        if (!word.value.english) {
          uni.showToast({ title: "请输入英文单词", duration: 2e3 });
          return;
        }
        try {
          antonymLoading.value = true;
          const pregen = await getPregenWord(word.value.english);
          if (pregen && Array.isArray(pregen.antonyms) && pregen.antonyms.length > 0) {
            word.value.antonyms = pregen.antonyms;
            if (wordId.value) {
              await db.updateWord(wordId.value, { antonyms: pregen.antonyms });
            }
            uni.showToast({ title: "已从本地词库加载反义词", duration: 2e3 });
            return;
          }
          const antonyms = await aiService.generateAntonyms(word.value.english, 3);
          word.value.antonyms = antonyms;
          if (wordId.value) {
            await db.updateWord(wordId.value, { antonyms });
            uni.showToast({ title: "反义词已更新", duration: 2e3 });
          } else {
            uni.showToast({ title: "反义词已生成", duration: 2e3 });
          }
        } catch (error) {
          formatAppLog("error", "at pages/word-detail/word-detail.vue:1149", "生成反义词失败:", error);
          uni.showToast({ title: "生成反义词失败", duration: 2e3 });
        } finally {
          antonymLoading.value = false;
        }
      };
      const generateWordFamilyInfo = async () => {
        if (!word.value.english)
          return;
        try {
          wordFamilyLoading.value = true;
          const result = await aiService.generateWordFamily(word.value.english);
          wordFamily.value = {
            derivatives: Array.isArray(result.derivatives) ? result.derivatives : [],
            collocations: Array.isArray(result.collocations) ? result.collocations : [],
            memory_tip: result.memory_tip || ""
          };
          saveWordExtra(word.value.english, { wordFamily: wordFamily.value });
          uni.showToast({ title: "词族已生成", icon: "none" });
        } catch (_2) {
          uni.showToast({ title: "生成词族失败", icon: "none" });
        } finally {
          wordFamilyLoading.value = false;
        }
      };
      const increaseRepeatCount = async () => {
        word.value.repeat_count = (word.value.repeat_count || 0) + 1;
        word.value.update_time = (/* @__PURE__ */ new Date()).toISOString();
        if (wordId.value) {
          await db.updateWord(wordId.value, {
            repeat_count: word.value.repeat_count,
            update_time: word.value.update_time
          });
        }
      };
      const decreaseRepeatCount = async () => {
      };
      const updateRepeatCount = async () => {
      };
      const markAsMastered = async () => {
        if (!wordId.value) {
          uni.showToast({ title: "请先保存单词", icon: "none" });
          return;
        }
        word.value.is_mastered = 1;
        word.value.mastered_at = (/* @__PURE__ */ new Date()).toISOString();
        await db.updateWord(wordId.value, {
          is_mastered: 1,
          mastered_at: word.value.mastered_at
        });
        uni.showToast({ title: "已斩掉！该单词将在复习中隐藏", icon: "success" });
      };
      const unmarkAsMastered = async () => {
        if (!wordId.value)
          return;
        word.value.is_mastered = 0;
        word.value.mastered_at = null;
        await db.updateWord(wordId.value, {
          is_mastered: 0,
          mastered_at: null
        });
        uni.showToast({ title: "已取消斩掉", icon: "none" });
      };
      const formatMasteredTime = (time) => {
        if (!time)
          return "";
        const date = new Date(time);
        const now = /* @__PURE__ */ new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1e3 * 60 * 60 * 24));
        if (days === 0)
          return "今天";
        if (days === 1)
          return "昨天";
        if (days < 7)
          return `${days}天前`;
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}月${day}日`;
      };
      const escapeRegExp = (s2) => String(s2 || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const formatHighlight = (text) => {
        if (!text)
          return "";
        let formattedText = text.replace(/\*\*(.*?)\*\*/g, function(match, word2) {
          return `<span style="color: #FF85A1; font-weight: bold;">${word2}</span>`;
        });
        if (word.value.english) {
          const targetWord = word.value.english;
          const targetRegex = new RegExp(`\\b(${escapeRegExp(targetWord)})\\b`, "gi");
          formattedText = formattedText.replace(targetRegex, `<span style="color: #FF85A1; font-weight: bold;">$1</span>`);
        }
        return formattedText;
      };
      const __returned__ = { word, POS_BREAK_REGEX, addNewlineBeforePos, example, synonymLoading, synonymContrastLoading, antonymLoading, synonymContrastText, wordFamilyLoading, wordFamily, sameTagWords, wordId, fromWordbookMode, examStats, examStatsTags, examStatsLoading, examSentences, examSentencesLoading, showAllExamSentences, detailHeavyLoading, get examFallbackTimer() {
        return examFallbackTimer;
      }, set examFallbackTimer(v2) {
        examFallbackTimer = v2;
      }, clearExamFallbackTimer, scheduleExamDataFallback, SECTION_ORDER: SECTION_ORDER2, examStatsBySection, examStatsYears, displayExamSentences, displayWordTags, sentimentLabel, examQuizSelected, examQuizSentence, examQuizAnswerIndex, examQuizAnswerText, loadExtraPanels, loadWordFromMasterDb, normalizeDefType: normalizeDefType2, getDefType, getDefTypeLabel, getLastWordInfo, loadExamDataLazy, loadWordFromWordbook, loadWord, retryLoadExamStats, loadSameTagWords, goToWord, selectExamQuiz, goBack, applyTag, onWordEnriched, save, cancel, deleteWord, editWord, generateExample, generateSynonyms, generateSynonymContrast, generateAntonyms, generateWordFamilyInfo, increaseRepeatCount, decreaseRepeatCount, updateRepeatCount, markAsMastered, unmarkAsMastered, formatMasteredTime, escapeRegExp, formatHighlight, ref: vue.ref, onMounted: vue.onMounted, watch: vue.watch, computed: vue.computed, get onLoad() {
        return onLoad;
      }, get onUnload() {
        return onUnload;
      }, get db() {
        return db;
      }, get aiService() {
        return aiService;
      }, get formatWordStatsForPrompt() {
        return formatWordStatsForPrompt;
      }, get pregenVocab() {
        return pregenVocab;
      }, get masterDb() {
        return masterDb;
      }, get getWordExtra() {
        return getWordExtra;
      }, get saveWordExtra() {
        return saveWordExtra;
      }, get logger() {
        return logger;
      }, get errorHandler() {
        return errorHandler;
      }, get cleanupExpiredCaches() {
        return cleanupExpiredCaches;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$a(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "custom-nav-bar" }, [
        vue.createElementVNode("view", {
          class: "nav-back-btn",
          onClick: $setup.goBack
        }, "‹")
      ]),
      $setup.wordId || $setup.fromWordbookMode ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "word-profile-card detail-card-shell"
      }, [
        vue.createElementVNode("view", { class: "word-input-wrap word-title-row" }, [
          !$setup.fromWordbookMode ? vue.withDirectives((vue.openBlock(), vue.createElementBlock(
            "input",
            {
              key: 0,
              type: "text",
              "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.word.english = $event),
              placeholder: "请输入英文单词",
              class: "word-input"
            },
            null,
            512
            /* NEED_PATCH */
          )), [
            [vue.vModelText, $setup.word.english]
          ]) : (vue.openBlock(), vue.createElementBlock(
            "text",
            {
              key: 1,
              class: "word-input word-readonly"
            },
            vue.toDisplayString($setup.word.english),
            1
            /* TEXT */
          ))
        ]),
        $setup.word.defs && $setup.word.defs.length ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "word-chinese-inline"
        }, [
          vue.createElementVNode("view", { class: "defs-list" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.word.defs, (item, idx) => {
                return vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: idx,
                    class: vue.normalizeClass(["def-item", {
                      "def-freq": $setup.getDefType(item) === "freq",
                      "def-rare": $setup.getDefType(item) === "rare",
                      "def-normal": $setup.getDefType(item) === "normal"
                    }])
                  },
                  [
                    vue.createElementVNode(
                      "view",
                      { class: "def-pos" },
                      vue.toDisplayString(item.pos || ""),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "view",
                      { class: "def-trans" },
                      vue.toDisplayString(item.trans || ""),
                      1
                      /* TEXT */
                    )
                  ],
                  2
                  /* CLASS */
                );
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])
        ])) : (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "word-chinese-inline"
        }, [
          !$setup.fromWordbookMode ? vue.withDirectives((vue.openBlock(), vue.createElementBlock(
            "textarea",
            {
              key: 0,
              "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $setup.word.chinese = $event),
              placeholder: "请输入中文释义（包含词性）",
              rows: "3",
              class: "word-chinese-textarea"
            },
            null,
            512
            /* NEED_PATCH */
          )), [
            [vue.vModelText, $setup.word.chinese]
          ]) : (vue.openBlock(), vue.createElementBlock(
            "text",
            {
              key: 1,
              class: "word-chinese-textarea word-readonly"
            },
            vue.toDisplayString($setup.word.chinese || "—"),
            1
            /* TEXT */
          ))
        ])),
        $setup.word.exam_tip ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 2,
          class: "exam-tip-box"
        }, [
          vue.createElementVNode(
            "view",
            { class: "exam-tip-text" },
            vue.toDisplayString($setup.word.exam_tip),
            1
            /* TEXT */
          )
        ])) : vue.createCommentVNode("v-if", true),
        $setup.displayWordTags.length || $setup.sentimentLabel ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 3,
          class: "word-tag-row"
        }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.displayWordTags, (tag, idx) => {
              return vue.openBlock(), vue.createElementBlock(
                "text",
                {
                  key: `tag-${idx}`,
                  class: "tag-chip-soft"
                },
                vue.toDisplayString(tag),
                1
                /* TEXT */
              );
            }),
            128
            /* KEYED_FRAGMENT */
          )),
          $setup.sentimentLabel ? (vue.openBlock(), vue.createElementBlock(
            "text",
            {
              key: 0,
              class: "tag-chip-soft sentiment-chip"
            },
            vue.toDisplayString($setup.sentimentLabel),
            1
            /* TEXT */
          )) : vue.createCommentVNode("v-if", true)
        ])) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode("view", { class: "metadata-row" }, [
          vue.createElementVNode("div", { class: "repeat-section" }, [
            vue.createElementVNode("label", { class: "small-label" }, "学习次数"),
            vue.createElementVNode("div", { class: "repeat-controls" }, [
              vue.createElementVNode(
                "span",
                { class: "repeat-value" },
                vue.toDisplayString($setup.word.repeat_count || 0),
                1
                /* TEXT */
              )
            ])
          ]),
          vue.createElementVNode("div", { class: "importance-section" }, [
            vue.createElementVNode("label", { class: "small-label" }, "重要程度"),
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass(["star-rating", { readonly: $setup.fromWordbookMode }])
              },
              [
                (vue.openBlock(), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList(5, (star) => {
                    return vue.createElementVNode("span", {
                      key: star,
                      class: vue.normalizeClass(["importance-dot", { active: ($setup.word.importance || 0) >= star }]),
                      onClick: ($event) => !$setup.fromWordbookMode && ($setup.word.importance = star)
                    }, "★", 10, ["onClick"]);
                  }),
                  64
                  /* STABLE_FRAGMENT */
                ))
              ],
              2
              /* CLASS */
            )
          ])
        ]),
        !$setup.fromWordbookMode ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 4,
          class: "master-action-row"
        }, [
          !$setup.word.is_mastered ? (vue.openBlock(), vue.createElementBlock("button", {
            key: 0,
            class: "btn-master",
            onClick: $setup.markAsMastered
          }, " ⚔️ 斩掉（已熟练） ")) : (vue.openBlock(), vue.createElementBlock("button", {
            key: 1,
            class: "btn-unmaster",
            onClick: $setup.unmarkAsMastered
          }, " ↩️ 取消斩掉 ")),
          $setup.word.is_mastered && $setup.word.mastered_at ? (vue.openBlock(), vue.createElementBlock(
            "text",
            {
              key: 2,
              class: "mastered-time"
            },
            " 已于 " + vue.toDisplayString($setup.formatMasteredTime($setup.word.mastered_at)) + " 斩掉 ",
            1
            /* TEXT */
          )) : vue.createCommentVNode("v-if", true)
        ])) : vue.createCommentVNode("v-if", true)
      ])) : (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "basic-info detail-card-shell"
      }, [
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("label", null, "英文"),
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              type: "text",
              "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $setup.word.english = $event),
              placeholder: "请输入英文单词"
            },
            null,
            512
            /* NEED_PATCH */
          ), [
            [vue.vModelText, $setup.word.english]
          ])
        ]),
        vue.createElementVNode("view", { class: "metadata-row" }, [
          vue.createElementVNode("div", { class: "importance-section" }, [
            vue.createElementVNode("label", { class: "small-label" }, "重要程度"),
            vue.createElementVNode("view", { class: "star-rating" }, [
              (vue.openBlock(), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList(5, (star) => {
                  return vue.createElementVNode("span", {
                    key: star,
                    class: vue.normalizeClass(["importance-dot", { active: $setup.word.importance >= star }]),
                    onClick: ($event) => $setup.word.importance = star
                  }, "★", 10, ["onClick"]);
                }),
                64
                /* STABLE_FRAGMENT */
              ))
            ])
          ])
        ])
      ])),
      !$setup.fromWordbookMode ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 2,
        class: "page-year-section one-line"
      }, [
        vue.createElementVNode("text", { class: "source-caption-inline" }, "来源"),
        vue.createElementVNode("view", { class: "page-info" }, [
          vue.createElementVNode("text", { class: "page-year-label" }, "页码"),
          vue.createElementVNode("view", { class: "page-year-input-wrap" }, [
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                type: "text",
                "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $setup.word.source_page = $event),
                placeholder: "P.",
                class: "page-year-input"
              },
              null,
              512
              /* NEED_PATCH */
            ), [
              [vue.vModelText, $setup.word.source_page]
            ])
          ])
        ]),
        vue.createElementVNode("view", { class: "year-info" }, [
          vue.createElementVNode("text", { class: "page-year-label" }, "年份"),
          vue.createElementVNode("view", { class: "page-year-input-wrap" }, [
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                type: "text",
                "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $setup.word.year = $event),
                placeholder: "如 2024",
                class: "page-year-input"
              },
              null,
              512
              /* NEED_PATCH */
            ), [
              [vue.vModelText, $setup.word.year]
            ])
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createElementVNode("view", { class: "form-item exam-stats-block" }, [
        vue.createElementVNode("view", { class: "soft-card-title" }, "真题统计"),
        vue.createElementVNode("view", { class: "exam-stats-content" }, [
          $setup.detailHeavyLoading && $setup.fromWordbookMode ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "detail-placeholder-block"
          }, "加载中…")) : $setup.examStatsLoading ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "exam-stats-row exam-stats-muted"
          }, "加载中…")) : $setup.examStats ? (vue.openBlock(), vue.createElementBlock(
            vue.Fragment,
            { key: 2 },
            [
              vue.createElementVNode("view", { class: "exam-stats-row exam-stats-row-primary" }, [
                vue.createElementVNode(
                  "text",
                  { class: "exam-stats-num" },
                  vue.toDisplayString($setup.examStats.total_count),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", { class: "exam-stats-unit" }, "次")
              ]),
              $setup.examStatsYears ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "exam-stats-row exam-stats-years-row"
              }, [
                vue.createElementVNode(
                  "text",
                  { class: "exam-stats-years" },
                  vue.toDisplayString($setup.examStatsYears),
                  1
                  /* TEXT */
                )
              ])) : vue.createCommentVNode("v-if", true),
              vue.createElementVNode("view", { class: "exam-stats-row" }, [
                vue.createElementVNode(
                  "text",
                  { class: "exam-stats-detail" },
                  vue.toDisplayString($setup.examStatsBySection),
                  1
                  /* TEXT */
                )
              ])
            ],
            64
            /* STABLE_FRAGMENT */
          )) : (vue.openBlock(), vue.createElementBlock("view", {
            key: 3,
            class: "exam-stats-row exam-stats-muted"
          }, [
            vue.createTextVNode(" 该词暂无真题数据 "),
            vue.createElementVNode("text", {
              class: "exam-stats-retry",
              onClick: $setup.retryLoadExamStats
            }, "重试加载")
          ]))
        ])
      ]),
      vue.createElementVNode("view", { class: "form-item detail-section-plain exam-sentences-plain" }, [
        vue.createElementVNode("view", { class: "soft-card-title" }, "真题出处"),
        vue.createElementVNode("view", { class: "example-container" }, [
          $setup.detailHeavyLoading && $setup.fromWordbookMode ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "detail-placeholder-block"
          }, "加载中…")) : $setup.examSentencesLoading ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "no-examples"
          }, "加载中…")) : $setup.displayExamSentences.length > 0 ? (vue.openBlock(), vue.createElementBlock(
            vue.Fragment,
            { key: 2 },
            [
              vue.createElementVNode("view", { class: "examples-list" }, [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList($setup.displayExamSentences, (item, idx) => {
                    return vue.openBlock(), vue.createElementBlock("view", {
                      key: idx,
                      class: "example-item"
                    }, [
                      vue.createElementVNode(
                        "view",
                        { class: "exam-sentence-meta" },
                        vue.toDisplayString(item.year) + "年 · " + vue.toDisplayString(item.exam_type) + " · " + vue.toDisplayString(item.section),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode("p", { class: "example-english" }, [
                        vue.createElementVNode("rich-text", {
                          nodes: $setup.formatHighlight(item.sentence)
                        }, null, 8, ["nodes"])
                      ])
                    ]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                ))
              ]),
              $setup.examSentences.length > 3 && !$setup.showAllExamSentences ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "center-action-row"
              }, [
                vue.createElementVNode(
                  "button",
                  {
                    class: "btn-solid btn-inline-action btn-inline-standalone",
                    onClick: _cache[5] || (_cache[5] = ($event) => $setup.showAllExamSentences = true)
                  },
                  " 查看全部 " + vue.toDisplayString($setup.examSentences.length) + " 条 ",
                  1
                  /* TEXT */
                )
              ])) : vue.createCommentVNode("v-if", true)
            ],
            64
            /* STABLE_FRAGMENT */
          )) : (vue.openBlock(), vue.createElementBlock("p", {
            key: 3,
            class: "no-examples"
          }, "暂无真题句子"))
        ])
      ]),
      $setup.displayExamSentences.length > 0 && $setup.word.defs && $setup.word.defs.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 3,
        class: "form-item"
      }, [
        vue.createElementVNode("view", { class: "soft-card-title" }, "真题练一练"),
        vue.createElementVNode("view", { class: "example-container" }, [
          vue.createElementVNode("view", { class: "exam-train-card" }, [
            vue.createElementVNode("p", { class: "example-english" }, [
              vue.createElementVNode("rich-text", {
                nodes: $setup.formatHighlight($setup.examQuizSentence)
              }, null, 8, ["nodes"])
            ]),
            vue.createElementVNode("p", { class: "example-chinese exam-train-tip" }, "判断这句更接近哪个义项"),
            vue.createElementVNode("view", { class: "exam-train-options" }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.word.defs.slice(0, 4), (item, idx) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    key: `quiz-${idx}`,
                    class: vue.normalizeClass(["exam-train-option", { active: $setup.examQuizSelected === idx }]),
                    onClick: ($event) => $setup.selectExamQuiz(idx)
                  }, [
                    vue.createElementVNode(
                      "text",
                      { class: "exam-train-option-label" },
                      vue.toDisplayString($setup.getDefTypeLabel(item) || "常用义"),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "text",
                      { class: "exam-train-option-text" },
                      vue.toDisplayString(item.pos || "") + " " + vue.toDisplayString(item.trans || ""),
                      1
                      /* TEXT */
                    )
                  ], 10, ["onClick"]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ]),
            $setup.examQuizSelected !== null ? (vue.openBlock(), vue.createElementBlock(
              "view",
              {
                key: 0,
                class: "exam-train-result"
              },
              " 推荐义项：" + vue.toDisplayString($setup.examQuizAnswerText),
              1
              /* TEXT */
            )) : vue.createCommentVNode("v-if", true)
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createElementVNode("view", { class: "form-item" }, [
        vue.createElementVNode("view", { class: "section-header" }, [
          vue.createElementVNode("view", { class: "soft-card-title" }, "例句")
        ]),
        vue.createElementVNode("view", { class: "example-container" }, [
          $setup.detailHeavyLoading && $setup.fromWordbookMode ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "detail-placeholder-block"
          }, "加载中…")) : $setup.word.examples && $setup.word.examples.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "examples-list"
          }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.word.examples, (item, index) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: index,
                  class: "example-item"
                }, [
                  vue.createElementVNode("p", { class: "example-english" }, [
                    vue.createElementVNode("rich-text", {
                      nodes: $setup.formatHighlight(item.english)
                    }, null, 8, ["nodes"])
                  ]),
                  vue.createElementVNode("p", { class: "example-chinese" }, [
                    vue.createElementVNode("rich-text", {
                      nodes: $setup.formatHighlight(item.chinese)
                    }, null, 8, ["nodes"])
                  ])
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])) : !$setup.fromWordbookMode && $setup.example ? (vue.openBlock(), vue.createElementBlock(
            "p",
            {
              key: 2,
              class: "example"
            },
            vue.toDisplayString($setup.example),
            1
            /* TEXT */
          )) : (vue.openBlock(), vue.createElementBlock("p", {
            key: 3,
            class: "no-examples"
          }, "暂无例句"))
        ]),
        vue.createElementVNode("view", { class: "center-action-row" }, [
          vue.createElementVNode("button", {
            onClick: $setup.generateExample,
            class: "btn-solid btn-inline-action"
          }, "重新生成")
        ])
      ]),
      vue.createElementVNode("view", { class: "form-item" }, [
        vue.createElementVNode("view", { class: "section-header" }, [
          vue.createElementVNode("view", { class: "soft-card-title" }, "近义词")
        ]),
        vue.createElementVNode("view", { class: "example-container" }, [
          $setup.detailHeavyLoading && $setup.fromWordbookMode ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "detail-placeholder-block"
          }, "加载中…")) : $setup.word.synonyms && $setup.word.synonyms.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "examples-list"
          }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.word.synonyms, (item, index) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: index,
                  class: "example-item synonym-item"
                }, [
                  vue.createElementVNode("view", { class: "synonym-header" }, [
                    vue.createElementVNode(
                      "span",
                      { class: "synonym-word" },
                      vue.toDisplayString(item.synonym),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "span",
                      { class: "synonym-chinese" },
                      vue.toDisplayString(item.chinese),
                      1
                      /* TEXT */
                    )
                  ]),
                  item.example ? (vue.openBlock(), vue.createElementBlock("p", {
                    key: 0,
                    class: "example-english"
                  }, [
                    vue.createElementVNode("rich-text", {
                      nodes: $setup.formatHighlight(item.example)
                    }, null, 8, ["nodes"])
                  ])) : vue.createCommentVNode("v-if", true),
                  item.exampleChinese ? (vue.openBlock(), vue.createElementBlock("p", {
                    key: 1,
                    class: "example-chinese"
                  }, [
                    vue.createElementVNode("rich-text", {
                      nodes: $setup.formatHighlight(item.exampleChinese)
                    }, null, 8, ["nodes"])
                  ])) : vue.createCommentVNode("v-if", true)
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])) : (vue.openBlock(), vue.createElementBlock("p", {
            key: 2,
            class: "no-examples"
          }, "暂无近义词"))
        ]),
        vue.createElementVNode("view", { class: "center-action-row" }, [
          vue.createElementVNode("button", {
            onClick: $setup.generateSynonyms,
            class: "btn-solid btn-inline-action",
            disabled: $setup.synonymLoading
          }, vue.toDisplayString($setup.synonymLoading ? "生成中..." : "重新生成"), 9, ["disabled"])
        ]),
        $setup.synonymContrastText ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "synonym-contrast-box"
        }, [
          vue.createElementVNode("view", { class: "exam-tip-title" }, "近义词辨析"),
          vue.createElementVNode("view", { class: "exam-tip-text" }, [
            vue.createElementVNode("rich-text", {
              nodes: $setup.formatHighlight($setup.synonymContrastText)
            }, null, 8, ["nodes"])
          ])
        ])) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode("view", { class: "center-action-row" }, [
          vue.createElementVNode("button", {
            onClick: $setup.generateSynonymContrast,
            class: "btn-solid btn-inline-action",
            disabled: $setup.synonymContrastLoading
          }, vue.toDisplayString($setup.synonymContrastLoading ? "生成中..." : "生成辨析"), 9, ["disabled"])
        ])
      ]),
      vue.createElementVNode("view", { class: "form-item" }, [
        vue.createElementVNode("view", { class: "section-header" }, [
          vue.createElementVNode("view", { class: "soft-card-title" }, "反义词")
        ]),
        vue.createElementVNode("view", { class: "example-container" }, [
          $setup.detailHeavyLoading && $setup.fromWordbookMode ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "detail-placeholder-block"
          }, "加载中…")) : $setup.word.antonyms && $setup.word.antonyms.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "examples-list"
          }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.word.antonyms, (item, index) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: index,
                  class: "example-item antonym-item"
                }, [
                  vue.createElementVNode("view", { class: "synonym-header" }, [
                    vue.createElementVNode(
                      "span",
                      { class: "synonym-word" },
                      vue.toDisplayString(item.antonym),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "span",
                      { class: "synonym-chinese" },
                      vue.toDisplayString(item.chinese),
                      1
                      /* TEXT */
                    )
                  ]),
                  item.example ? (vue.openBlock(), vue.createElementBlock("p", {
                    key: 0,
                    class: "example-english"
                  }, [
                    vue.createElementVNode("rich-text", {
                      nodes: $setup.formatHighlight(item.example)
                    }, null, 8, ["nodes"])
                  ])) : vue.createCommentVNode("v-if", true),
                  item.exampleChinese ? (vue.openBlock(), vue.createElementBlock("p", {
                    key: 1,
                    class: "example-chinese"
                  }, [
                    vue.createElementVNode("rich-text", {
                      nodes: $setup.formatHighlight(item.exampleChinese)
                    }, null, 8, ["nodes"])
                  ])) : vue.createCommentVNode("v-if", true)
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])) : (vue.openBlock(), vue.createElementBlock("p", {
            key: 2,
            class: "no-examples"
          }, "暂无反义词"))
        ]),
        vue.createElementVNode("view", { class: "center-action-row" }, [
          vue.createElementVNode("button", {
            onClick: $setup.generateAntonyms,
            class: "btn-solid btn-inline-action",
            disabled: $setup.antonymLoading
          }, vue.toDisplayString($setup.antonymLoading ? "生成中..." : "重新生成"), 9, ["disabled"])
        ])
      ]),
      vue.createElementVNode("view", { class: "form-item" }, [
        vue.createElementVNode("view", { class: "soft-card-title" }, "词族与搭配"),
        vue.createElementVNode("view", { class: "example-container" }, [
          $setup.wordFamily.derivatives.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "examples-list"
          }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.wordFamily.derivatives, (item, index) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: `der-${index}`,
                  class: "example-item synonym-item"
                }, [
                  vue.createElementVNode("view", { class: "synonym-header" }, [
                    vue.createElementVNode(
                      "span",
                      { class: "synonym-word" },
                      vue.toDisplayString(item.word),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "span",
                      { class: "synonym-chinese" },
                      vue.toDisplayString(item.chinese),
                      1
                      /* TEXT */
                    )
                  ]),
                  item.hint ? (vue.openBlock(), vue.createElementBlock(
                    "p",
                    {
                      key: 0,
                      class: "example-chinese"
                    },
                    vue.toDisplayString(item.hint),
                    1
                    /* TEXT */
                  )) : vue.createCommentVNode("v-if", true)
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])) : (vue.openBlock(), vue.createElementBlock("p", {
            key: 1,
            class: "no-examples"
          }, "暂无词族数据")),
          $setup.wordFamily.collocations.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 2,
            class: "collocation-wrap"
          }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.wordFamily.collocations, (item, idx) => {
                return vue.openBlock(), vue.createElementBlock(
                  "text",
                  {
                    key: `col-${idx}`,
                    class: "collocation-chip"
                  },
                  vue.toDisplayString(item.phrase) + " · " + vue.toDisplayString(item.chinese),
                  1
                  /* TEXT */
                );
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])) : vue.createCommentVNode("v-if", true),
          $setup.wordFamily.memory_tip ? (vue.openBlock(), vue.createElementBlock(
            "p",
            {
              key: 3,
              class: "example-chinese"
            },
            vue.toDisplayString($setup.wordFamily.memory_tip),
            1
            /* TEXT */
          )) : vue.createCommentVNode("v-if", true)
        ]),
        vue.createElementVNode("view", { class: "center-action-row" }, [
          vue.createElementVNode("button", {
            onClick: $setup.generateWordFamilyInfo,
            class: "btn-solid btn-inline-action",
            disabled: $setup.wordFamilyLoading
          }, vue.toDisplayString($setup.wordFamilyLoading ? "生成中..." : "生成词族/搭配"), 9, ["disabled"])
        ])
      ]),
      $setup.wordId && $setup.sameTagWords.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 4,
        class: "form-item same-tag-section"
      }, [
        vue.createElementVNode("label", null, "相关词"),
        vue.createElementVNode("view", { class: "same-tag-list" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.sameTagWords, (w2) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: w2.id,
                class: "same-tag-item",
                onClick: ($event) => $setup.goToWord(w2.id)
              }, [
                vue.createElementVNode(
                  "text",
                  { class: "same-tag-eng" },
                  vue.toDisplayString(w2.english),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "same-tag-chi" },
                  vue.toDisplayString(w2.chinese),
                  1
                  /* TEXT */
                )
              ], 8, ["onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createElementVNode("view", { class: "footer" }, [
        $setup.wordId && !$setup.fromWordbookMode ? (vue.openBlock(), vue.createElementBlock("button", {
          key: 0,
          onClick: $setup.deleteWord,
          class: "delete-button"
        }, "删除")) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode("button", {
          onClick: $setup.cancel,
          class: "cancel-button"
        }, "取消"),
        !$setup.fromWordbookMode ? (vue.openBlock(), vue.createElementBlock("button", {
          key: 1,
          onClick: $setup.save,
          class: "save-button"
        }, "保存")) : vue.createCommentVNode("v-if", true)
      ])
    ]);
  }
  const PagesWordDetailWordDetail = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["render", _sfc_render$a], ["__scopeId", "data-v-008cde92"], ["__file", "E:/vocal/wordbook_new/pages/word-detail/word-detail.vue"]]);
  const MASTERED_WORDBOOK_WORDS_KEY = "mastered_wordbook_words_v1";
  const getMasteredWordbookWords = (wordbookId) => {
    try {
      const raw = uni.getStorageSync(MASTERED_WORDBOOK_WORDS_KEY);
      const data = raw ? JSON.parse(raw) : {};
      return new Set(data[wordbookId] || []);
    } catch (e2) {
      formatAppLog("error", "at src/utils/masteredWordbookWords.js:19", "getMasteredWordbookWords 失败:", e2);
      return /* @__PURE__ */ new Set();
    }
  };
  const addMasteredWordbookWord = (wordbookId, english) => {
    try {
      const raw = uni.getStorageSync(MASTERED_WORDBOOK_WORDS_KEY);
      const data = raw ? JSON.parse(raw) : {};
      if (!data[wordbookId])
        data[wordbookId] = [];
      if (!data[wordbookId].includes(english)) {
        data[wordbookId].push(english);
      }
      uni.setStorageSync(MASTERED_WORDBOOK_WORDS_KEY, JSON.stringify(data));
      formatAppLog("log", "at src/utils/masteredWordbookWords.js:38", "addMasteredWordbookWord: 成功标记", wordbookId, english);
    } catch (e2) {
      formatAppLog("error", "at src/utils/masteredWordbookWords.js:40", "addMasteredWordbookWord 失败:", e2);
    }
  };
  const removeMasteredWordbookWord = (wordbookId, english) => {
    try {
      const raw = uni.getStorageSync(MASTERED_WORDBOOK_WORDS_KEY);
      const data = raw ? JSON.parse(raw) : {};
      if (data[wordbookId]) {
        data[wordbookId] = data[wordbookId].filter((w2) => w2 !== english);
      }
      uni.setStorageSync(MASTERED_WORDBOOK_WORDS_KEY, JSON.stringify(data));
      formatAppLog("log", "at src/utils/masteredWordbookWords.js:57", "removeMasteredWordbookWord: 成功取消", wordbookId, english);
    } catch (e2) {
      formatAppLog("error", "at src/utils/masteredWordbookWords.js:59", "removeMasteredWordbookWord 失败:", e2);
    }
  };
  const REVIEW_PLAN_KEY = "reviewPlanByBook_v2";
  const _sfc_main$9 = {
    __name: "review",
    setup(__props, { expose: __expose }) {
      __expose();
      const showSettings = vue.ref(false);
      const showModeSelector = vue.ref(false);
      const showSortSelector = vue.ref(false);
      const showCountSelector = vue.ref(false);
      const showDifficultySelector = vue.ref(false);
      const reviewStarted = vue.ref(false);
      const reviewFinished = vue.ref(false);
      const settings = vue.ref({
        mode: "choice",
        sortBy: "smart",
        count: 20
      });
      const reviewWords = vue.ref([]);
      const currentIndex = vue.ref(0);
      const currentWord = vue.ref(null);
      const currentOptions = vue.ref([]);
      const fillOptions = vue.ref([]);
      const currentFillSentenceChinese = vue.ref("");
      const spellInput = vue.ref("");
      const escapeRegExp = (s2) => String(s2 || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const formatHighlight = (text) => {
        if (!text)
          return "";
        let formattedText = text.replace(/\*\*(.*?)\*\*/g, function(match, word) {
          return `<span style="color: #FF85A1; font-weight: bold;">${word}</span>`;
        });
        if (currentWord.value && currentWord.value.english) {
          const targetWord = currentWord.value.english;
          const targetRegex = new RegExp(`\\b(${escapeRegExp(targetWord)})\\b`, "gi");
          formattedText = formattedText.replace(targetRegex, `<span style="color: #FF85A1; font-weight: bold;">$1</span>`);
        }
        return formattedText;
      };
      const currentSentence = vue.ref("");
      const fillAnswer = vue.ref("");
      const aiSentence = vue.ref("");
      const userTranslation = vue.ref("");
      const aiResult = vue.ref(null);
      const isGenerating = vue.ref(false);
      const isSubmitting = vue.ref(false);
      const formatAIPhighlight = (text) => {
        if (!text)
          return "";
        let formattedText = text;
        if (currentWord.value && currentWord.value.english) {
          const targetWord = currentWord.value.english;
          const targetRegex = new RegExp(`\\b(${escapeRegExp(targetWord)})\\b`, "gi");
          formattedText = formattedText.replace(targetRegex, `<span style="color: #FF85A1; font-weight: bold; background-color: #FFF0F3; padding: 2px 4px; border-radius: 4px;">$1</span>`);
        }
        return formattedText;
      };
      const selectedOption = vue.ref("");
      const showResult = vue.ref(false);
      const showWrongFeedback = vue.ref(false);
      const correctCount = vue.ref(0);
      const wrongCount = vue.ref(0);
      const wrongWords = vue.ref([]);
      const lastReviewResult = vue.ref(null);
      const showResumeModal = vue.ref(false);
      const hasProgress = vue.ref(false);
      const activeSettingCard = vue.ref("mode");
      const dashboardDone = vue.ref(0);
      const dashboardTotal = vue.ref(0);
      const bookTotalWords = vue.ref(0);
      const totalReviewedWords = vue.ref(0);
      const todayReviewed = vue.ref(0);
      const learnedUniqueWords = vue.ref(0);
      const dashboardSnapshot = vue.ref({ dueCount: 0, overdueCount: 0, mistakeCount: 0, firstDayDue: 0 });
      const showMasteredConfirm = vue.ref(false);
      const reviewPreset = vue.ref("default");
      const sessionNewCount = vue.ref(0);
      const sessionOldCount = vue.ref(0);
      const getReviewProgressKey = () => `reviewProgress_${getCurrentBookId()}`;
      const getSettingsKey = () => `reviewSettings_${getCurrentBookId()}`;
      const getLastReviewResultKey = () => `lastReviewResult_${getCurrentBookId()}`;
      const getWordKey = (word) => {
        if (!word)
          return "";
        const english = typeof word === "string" ? word : word.english;
        return String(english || "").trim().toLowerCase();
      };
      const uniqueWordKeys = (list) => {
        if (!Array.isArray(list))
          return [];
        return [...new Set(list.map((item) => getWordKey(item)).filter(Boolean))];
      };
      const saveReviewProgress = () => {
        if (!reviewStarted.value || reviewFinished.value || reviewWords.value.length === 0)
          return;
        uni.setStorageSync(getReviewProgressKey(), {
          reviewWords: reviewWords.value,
          currentIndex: currentIndex.value,
          correctCount: correctCount.value,
          wrongCount: wrongCount.value,
          wrongWords: [...wrongWords.value],
          settings: { ...settings.value },
          reviewPreset: reviewPreset.value,
          sessionNewCount: sessionNewCount.value,
          sessionOldCount: sessionOldCount.value
        });
        hasProgress.value = true;
      };
      const clearReviewProgress = () => {
        uni.removeStorageSync(getReviewProgressKey());
        hasProgress.value = false;
      };
      const loadReviewProgress = () => {
        try {
          const saved = uni.getStorageSync(getReviewProgressKey());
          return saved && saved.reviewWords && saved.reviewWords.length > 0 ? saved : null;
        } catch (e2) {
          return null;
        }
      };
      const resumeReview = () => {
        const saved = loadReviewProgress();
        if (!saved)
          return;
        reviewWords.value = saved.reviewWords;
        currentIndex.value = saved.currentIndex;
        correctCount.value = saved.correctCount;
        wrongCount.value = saved.wrongCount;
        wrongWords.value = saved.wrongWords || [];
        settings.value = saved.settings || settings.value;
        reviewPreset.value = saved.reviewPreset || "default";
        sessionNewCount.value = Number(saved.sessionNewCount || 0);
        sessionOldCount.value = Number(saved.sessionOldCount || 0);
        reviewStarted.value = true;
        reviewFinished.value = false;
        showResumeModal.value = false;
        syncDashboardProgress();
        loadCurrentQuestion();
      };
      const discardReview = () => {
        clearReviewProgress();
        showResumeModal.value = false;
        syncDashboardProgress();
      };
      const checkProgress = () => {
        hasProgress.value = !!loadReviewProgress();
        syncDashboardProgress();
      };
      const getTodayKey = () => {
        const d2 = /* @__PURE__ */ new Date();
        const m2 = `${d2.getMonth() + 1}`.padStart(2, "0");
        const day = `${d2.getDate()}`.padStart(2, "0");
        return `${d2.getFullYear()}-${m2}-${day}`;
      };
      const normalizePlanEntry = (entry = {}) => ({
        completed: Math.max(0, Number(entry.completed || 0)),
        learnedKeys: uniqueWordKeys(entry.learnedKeys),
        roundReviewedKeys: uniqueWordKeys(entry.roundReviewedKeys || entry.completedKeys),
        todayKey: typeof entry.todayKey === "string" ? entry.todayKey : "",
        todayKeys: uniqueWordKeys(entry.todayKeys),
        updatedAt: Number(entry.updatedAt || Date.now())
      });
      const loadPlanStore = () => {
        try {
          const raw = uni.getStorageSync(REVIEW_PLAN_KEY);
          if (!raw)
            return {};
          if (typeof raw === "string") {
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? parsed : {};
          }
          return raw && typeof raw === "object" ? raw : {};
        } catch (_2) {
          return {};
        }
      };
      const savePlanStore = (obj) => {
        try {
          uni.setStorageSync(REVIEW_PLAN_KEY, JSON.stringify(obj || {}));
        } catch (_2) {
        }
      };
      const getCurrentBookId = () => getCurrentWordbook() || "self";
      const getPlanEntry = (bookId = getCurrentBookId()) => normalizePlanEntry(loadPlanStore()[bookId] || {});
      const savePlanEntry = (bookId, entry) => {
        const store = loadPlanStore();
        const next = normalizePlanEntry(entry);
        store[bookId] = next;
        savePlanStore(store);
        return next;
      };
      const getCurrentBookTotalWords = async () => {
        const book = getCurrentBookId();
        try {
          if (book === "self") {
            const all = await db.getAllWords();
            return Array.isArray(all) ? all.length : 0;
          }
          if (isLocalWordbookKey(book)) {
            const list2 = await loadLocalWordbook(book);
            return Array.isArray(list2) ? list2.length : 0;
          }
          const list = getWordbookWords(book) || [];
          return Array.isArray(list) ? list.length : 0;
        } catch (_2) {
          return 0;
        }
      };
      const getCurrentBookWordPool2 = async () => {
        const book = getCurrentBookId();
        if (book === "self") {
          return await db.getAllWords();
        }
        if (isLocalWordbookKey(book)) {
          const list = await loadLocalWordbook(book);
          const dictLookup = await getWordBriefBatch(list.map((w2) => w2.english));
          return list.map((w2) => {
            const v2 = dictLookup[(w2.english || "").trim().toLowerCase()];
            const chinese = v2 && typeof v2 === "object" && v2.chinese != null ? String(v2.chinese).trim() : (typeof v2 === "string" ? v2 : "").trim();
            return {
              id: null,
              english: w2.english,
              chinese,
              importance: w2.importance,
              examples: [],
              synonyms: [],
              antonyms: []
            };
          });
        }
        return getWordbookWords(book) || [];
      };
      const filterWordsByKeys = (list, keySet) => {
        const set = keySet instanceof Set ? keySet : new Set(keySet || []);
        return (list || []).filter((item) => set.has(getWordKey(item)));
      };
      const refreshDashboardSnapshot = async () => {
        try {
          const pool = await getCurrentBookWordPool2();
          dashboardSnapshot.value = getLearningDashboard(pool, getCurrentBookId());
        } catch (_2) {
          dashboardSnapshot.value = { dueCount: 0, overdueCount: 0, mistakeCount: 0, firstDayDue: 0 };
        }
      };
      const refreshPlanStats = async () => {
        bookTotalWords.value = await getCurrentBookTotalWords();
        const bookId = getCurrentBookId();
        const plan = getPlanEntry(bookId);
        totalReviewedWords.value = Number(plan.completed || 0);
        learnedUniqueWords.value = plan.learnedKeys.length;
        todayReviewed.value = plan.todayKey === getTodayKey() ? plan.todayKeys.length : 0;
        refreshDashboardSnapshot().catch(() => {
          dashboardSnapshot.value = { dueCount: 0, overdueCount: 0, mistakeCount: 0, firstDayDue: 0 };
        });
      };
      const resetCurrentPlan = () => {
        savePlanEntry(getCurrentBookId(), {
          completed: 0,
          learnedKeys: [],
          roundReviewedKeys: [],
          todayKey: getTodayKey(),
          todayKeys: [],
          updatedAt: Date.now()
        });
        totalReviewedWords.value = 0;
        learnedUniqueWords.value = 0;
        todayReviewed.value = 0;
      };
      const markWordsReviewed = (words) => {
        const list = Array.isArray(words) ? words : [words];
        if (!list.length)
          return;
        const bookId = getCurrentBookId();
        const total = Math.max(0, Number(bookTotalWords.value || 0));
        const todayKey = getTodayKey();
        const old = getPlanEntry(bookId);
        const learnedSet = new Set(old.learnedKeys);
        const roundSet = new Set(old.roundReviewedKeys);
        const todaySet = new Set(old.todayKey === todayKey ? old.todayKeys : []);
        let completed = Number(old.completed || 0);
        let newWordsCount = 0;
        let oldWordsCount = 0;
        for (const item of list) {
          const key = getWordKey(item);
          if (!key)
            continue;
          const isNew = !learnedSet.has(key);
          if (isNew)
            newWordsCount++;
          else
            oldWordsCount++;
          learnedSet.add(key);
          todaySet.add(key);
          if (total > 0 && roundSet.size >= total) {
            roundSet.clear();
          }
          if (!roundSet.has(key)) {
            roundSet.add(key);
            completed += 1;
          }
        }
        const next = savePlanEntry(bookId, {
          ...old,
          completed,
          learnedKeys: [...learnedSet],
          roundReviewedKeys: [...roundSet],
          todayKey,
          todayKeys: [...todaySet],
          updatedAt: Date.now()
        });
        totalReviewedWords.value = next.completed;
        learnedUniqueWords.value = next.learnedKeys.length;
        todayReviewed.value = next.todayKeys.length;
        sessionNewCount.value += newWordsCount;
        sessionOldCount.value += oldWordsCount;
      };
      const getOldReviewQuota = (count, oldPoolSize, newPoolSize) => {
        if (oldPoolSize <= 0)
          return 0;
        if (newPoolSize <= 0)
          return Math.min(count, oldPoolSize);
        return Math.min(oldPoolSize, Math.max(2, Math.min(count - 1, Math.round(count * 0.25))));
      };
      const shuffleList = (list) => {
        const arr = Array.isArray(list) ? [...list] : [];
        for (let i2 = arr.length - 1; i2 > 0; i2--) {
          const j2 = Math.floor(Math.random() * (i2 + 1));
          [arr[i2], arr[j2]] = [arr[j2], arr[i2]];
        }
        return arr;
      };
      const interleaveOldWords = (freshWords, oldWords, count) => {
        const fresh = shuffleList(freshWords).map((item) => ({ ...item, __isOldReview: false }));
        const old = shuffleList(oldWords).map((item) => ({ ...item, __isOldReview: true }));
        const result = [];
        const step = Math.max(2, Math.round(fresh.length / Math.max(old.length, 1)));
        let freshIndex = 0;
        let oldIndex = 0;
        while (result.length < count && (freshIndex < fresh.length || oldIndex < old.length)) {
          let pushedFresh = 0;
          while (freshIndex < fresh.length && pushedFresh < step && result.length < count) {
            result.push(fresh[freshIndex++]);
            pushedFresh++;
          }
          if (oldIndex < old.length && result.length < count) {
            result.push(old[oldIndex++]);
          }
        }
        return result.slice(0, count);
      };
      const syncDashboardProgress = () => {
        const saved = loadReviewProgress();
        if (saved && Array.isArray(saved.reviewWords) && saved.reviewWords.length > 0) {
          dashboardDone.value = Math.min(Number(saved.currentIndex || 0), saved.reviewWords.length);
          dashboardTotal.value = saved.reviewWords.length;
        } else {
          dashboardDone.value = 0;
          dashboardTotal.value = settings.value.count;
        }
      };
      const dashboardTarget = vue.computed(() => {
        if (settings.value.difficulty === "hard") {
          return Math.max(settings.value.count, Math.ceil(settings.value.count * 1.2));
        }
        return settings.value.count;
      });
      const dashboardPercent = vue.computed(() => {
        const total = Number(dashboardTotal.value || 0);
        if (!total)
          return 0;
        const pct = Math.round(Number(dashboardDone.value || 0) / total * 100);
        return Math.max(0, Math.min(100, pct));
      });
      const formatRelativeReviewTime = (isoString) => {
        if (!isoString)
          return "待计算";
        const now = /* @__PURE__ */ new Date();
        const target = new Date(isoString);
        if (Number.isNaN(target.getTime()))
          return "待计算";
        const diffMs = target - now;
        const absMinutes = Math.round(Math.abs(diffMs) / (1e3 * 60));
        if (absMinutes < 60)
          return diffMs >= 0 ? `${Math.max(1, absMinutes)} 分钟后` : `${Math.max(1, absMinutes)} 分钟前`;
        const absHours = Math.round(absMinutes / 60);
        if (absHours < 24)
          return diffMs >= 0 ? `${absHours} 小时后` : `${absHours} 小时前`;
        const absDays = Math.round(absHours / 24);
        return diffMs >= 0 ? `${absDays} 天后` : `${absDays} 天前`;
      };
      const currentReviewInsight = vue.computed(() => {
        var _a;
        if (!isSelfWordbook() || !((_a = currentWord.value) == null ? void 0 : _a.id))
          return null;
        const insight = db.getReviewInsight(currentWord.value);
        if (!insight)
          return null;
        return {
          ...insight,
          nextReviewText: formatRelativeReviewTime(insight.next_review_time)
        };
      });
      const applyReviewPreview = (isCorrect) => {
        var _a;
        if (!((_a = currentWord.value) == null ? void 0 : _a.id))
          return;
        const preview = db.previewReviewState(currentWord.value, isCorrect);
        if (!preview)
          return;
        currentWord.value = { ...currentWord.value, ...preview };
        const idx = Number(currentIndex.value || 0);
        if (Array.isArray(reviewWords.value) && reviewWords.value[idx]) {
          reviewWords.value[idx] = { ...reviewWords.value[idx], ...preview };
        }
      };
      const finishedReviewInsight = vue.computed(() => {
        if (!isSelfWordbook())
          return null;
        const list = (reviewWords.value || []).map((word) => db.getReviewInsight(word)).filter(Boolean);
        if (!list.length)
          return null;
        const avgMastery = Math.round(list.reduce((sum, item) => sum + (item.mastery || 0), 0) / list.length);
        const nextTimes = list.map((item) => item.next_review_time).filter(Boolean).sort();
        return {
          avgMastery,
          scheduledCount: list.length,
          nextReviewText: nextTimes.length ? formatRelativeReviewTime(nextTimes[0]) : "待计算"
        };
      });
      const completedInRound = vue.computed(() => {
        const total = Number(bookTotalWords.value || 0);
        if (total <= 0)
          return 0;
        return Number(totalReviewedWords.value || 0) % total;
      });
      const currentRound = vue.computed(() => {
        const total = Number(bookTotalWords.value || 0);
        if (total <= 0)
          return 1;
        return Math.floor(Number(totalReviewedWords.value || 0) / total) + 1;
      });
      const currentProgressPercent = vue.computed(() => {
        const total = Number(bookTotalWords.value || 0);
        if (total <= 0)
          return 0;
        return Math.max(0, Math.min(100, Math.round(Math.min(learnedUniqueWords.value, total) / total * 100)));
      });
      const oldReviewDailyTarget = vue.computed(() => {
        if (!learnedUniqueWords.value)
          return 0;
        return Math.min(learnedUniqueWords.value, Math.max(3, Math.round(Number(settings.value.count || 0) * 0.25)));
      });
      const dailyNewTarget = vue.computed(() => {
        return Math.max(1, Number(settings.value.count || 0) - Number(oldReviewDailyTarget.value || 0));
      });
      const remainDays = vue.computed(() => {
        const total = Number(bookTotalWords.value || 0);
        if (total <= 0)
          return 0;
        const remainingWords = Math.max(total - learnedUniqueWords.value, 0);
        if (remainingWords <= 0)
          return 0;
        return Math.max(1, Math.ceil(remainingWords / dailyNewTarget.value));
      });
      const remainingNewWords = vue.computed(() => {
        const total = Number(bookTotalWords.value || 0);
        if (total <= 0)
          return 0;
        return Math.max(total - learnedUniqueWords.value, 0);
      });
      const estimatedFinishDate = vue.computed(() => {
        if (!bookTotalWords.value)
          return "—";
        if (remainDays.value <= 0)
          return "今日";
        const days = Math.max(remainDays.value, 1);
        const d2 = /* @__PURE__ */ new Date();
        d2.setDate(d2.getDate() + days - 1);
        const m2 = `${d2.getMonth() + 1}`.padStart(2, "0");
        const day = `${d2.getDate()}`.padStart(2, "0");
        return `${m2}/${day}`;
      });
      const dailyPlanText = vue.computed(() => {
        if (oldReviewDailyTarget.value > 0) {
          if (remainDays.value <= 0) {
            return `新词已学完，当前每日复习 ${oldReviewDailyTarget.value} 词巩固记忆`;
          }
          return `每日新学 ${dailyNewTarget.value} 词，穿插复习 ${oldReviewDailyTarget.value} 词，剩余 ${remainDays.value} 天，预计完成 ${estimatedFinishDate.value}`;
        }
        return `每日 ${settings.value.count} 词，剩余 ${remainDays.value} 天，预计完成 ${estimatedFinishDate.value}`;
      });
      const isTodayTargetDone = vue.computed(() => {
        const target = Number(settings.value.count || 0);
        return target > 0 && todayReviewed.value >= target;
      });
      const primaryStartText = vue.computed(() => {
        if (reviewPreset.value === "due")
          return "开始到期复习";
        if (reviewPreset.value === "wrong")
          return "开始错词再练";
        if (reviewPreset.value === "firstday")
          return "开始首日巩固";
        return isTodayTargetDone.value ? "再来一组20" : "开始复习";
      });
      const todayProgressPercent = vue.computed(() => {
        const target = Number(settings.value.count || 0);
        if (target === 0)
          return 0;
        const current = reviewStarted.value ? currentIndex.value + 1 : todayReviewed.value;
        return Math.min(100, Math.round(current / target * 100));
      });
      const recommendedPreset = vue.computed(() => {
        if (dashboardSnapshot.value.dueCount > 0)
          return "due";
        if (dashboardSnapshot.value.mistakeCount > 0)
          return "wrong";
        if (dashboardSnapshot.value.firstDayDue > 0)
          return "firstday";
        return "default";
      });
      const recommendedPresetIcon = vue.computed(() => {
        return "";
      });
      const recommendedPresetTitle = vue.computed(() => {
        const titles = { due: "今日到期", wrong: "错词本", firstday: "首日巩固", default: "随机复习" };
        return titles[recommendedPreset.value] || "随机复习";
      });
      const recommendedPresetDesc = vue.computed(() => {
        const preset = recommendedPreset.value;
        if (preset === "due")
          return `${dashboardSnapshot.value.dueCount} 个单词需要复习`;
        if (preset === "wrong")
          return `${dashboardSnapshot.value.mistakeCount} 个单词需要巩固`;
        if (preset === "firstday")
          return `${dashboardSnapshot.value.firstDayDue} 个单词待复习`;
        return "从所有单词中随机抽取";
      });
      const otherPresets = vue.computed(() => {
        const all = [
          { key: "due", icon: "", title: "今日到期", count: dashboardSnapshot.value.dueCount },
          { key: "wrong", icon: "", title: "错词本", count: dashboardSnapshot.value.mistakeCount },
          { key: "firstday", icon: "", title: "首日巩固", count: dashboardSnapshot.value.firstDayDue },
          { key: "default", icon: "", title: "随机复习", count: 0 }
        ];
        return all.filter((p2) => p2.key !== recommendedPreset.value);
      });
      const currentWordbookName = vue.computed(() => {
        const current = getCurrentWordbook();
        if (current === "self")
          return "自用单词";
        const list = getWordbookListForUI();
        const hit = list.find((item) => item.id === current);
        return (hit == null ? void 0 : hit.name) || current || "当前词书";
      });
      const openSettings = (key) => {
        activeSettingCard.value = key;
        showSettings.value = true;
      };
      const sortByText = vue.computed(() => {
        const map = { smart: "智能推荐", error: "难点先行", new: "新词优先" };
        return map[settings.value.sortBy] || "智能推荐";
      });
      const isLastQuestion = vue.computed(() => {
        return currentIndex.value >= reviewWords.value.length - 1;
      });
      const modeOptions = ["看英文选中文", "看中文选英文", "AI例句填空", "AI语境复习", "拼写填空"];
      const sortOptions = ["智能推荐", "难点先行", "新词优先"];
      const countOptions = [20, 30, 40, 50, 80, 100, 200, 500, 800, 1e3];
      const dailyQuickOptions = [20, 50, 100, 200, 500, 800, 1e3];
      const modeIndex = vue.computed(() => {
        const map = { choice: 0, choice_en: 1, fill: 2, ai: 3, spell: 4 };
        return map[settings.value.mode] ?? 0;
      });
      const modeDisplayText = vue.computed(() => {
        const map = { choice: "看英文选中文", choice_en: "看中文选英文", fill: "AI例句填空", ai: "AI语境复习", spell: "拼写填空" };
        return map[settings.value.mode] || "看英文选中文";
      });
      const sortIndex = vue.computed(() => {
        const map = { smart: 0, error: 1, new: 2 };
        return map[settings.value.sortBy] || 0;
      });
      const countIndex = vue.computed(() => countOptions.indexOf(settings.value.count) >= 0 ? countOptions.indexOf(settings.value.count) : 3);
      const onModeChange = (e2) => {
        const map = ["choice", "choice_en", "fill", "ai", "spell"];
        settings.value.mode = map[e2.detail.value] || "choice";
        saveSettings();
      };
      const onSortChange = (e2) => {
        const map = ["smart", "error", "new"];
        settings.value.sortBy = map[e2.detail.value];
        saveSettings();
      };
      const onCountChange = (e2) => {
        settings.value.count = countOptions[e2.detail.value];
        saveSettings();
      };
      const setDailyTarget = (n2) => {
        settings.value.count = Number(n2);
        saveSettings();
      };
      const onDifficultyChange = (difficulty) => {
        settings.value.difficulty = difficulty;
        saveSettings();
      };
      const openModeSelector = () => {
        showModeSelector.value = true;
      };
      const openSortSelector = () => {
        showSortSelector.value = true;
      };
      const openCountSelector = () => {
        showCountSelector.value = true;
      };
      const openDifficultySelector = () => {
        showDifficultySelector.value = true;
      };
      onLoad((options) => {
        reviewPreset.value = options && options.preset ? String(options.preset) : "default";
      });
      vue.onMounted(() => {
        loadSettings();
        loadLastReviewResult();
        checkProgress();
        syncDashboardProgress();
        setTimeout(() => {
          refreshPlanStats();
        }, 350);
      });
      onShow(() => {
        loadLastReviewResult();
        checkProgress();
        setTimeout(() => {
          refreshPlanStats();
        }, 350);
      });
      onHide(() => {
        if (reviewStarted.value && !reviewFinished.value) {
          setTimeout(() => saveReviewProgress(), 300);
        }
      });
      onUnload(() => {
        if (reviewStarted.value && !reviewFinished.value) {
          saveReviewProgress();
        }
        try {
          cleanupExpiredCaches();
        } catch (error) {
          logger.warn("Review", "清理缓存失败", error);
        }
      });
      const loadSettings = () => {
        const saved = uni.getStorageSync(getSettingsKey()) || uni.getStorageSync("reviewSettings");
        if (saved) {
          settings.value = saved;
        }
      };
      const saveSettings = () => {
        uni.setStorageSync(getSettingsKey(), settings.value);
        syncDashboardProgress();
        refreshPlanStats();
      };
      const loadLastReviewResult = () => {
        const saved = uni.getStorageSync(getLastReviewResultKey()) || getLatestSession(getCurrentBookId());
        if (saved) {
          lastReviewResult.value = saved.accuracy != null ? saved : {
            correctCount: saved.correctCount || 0,
            wrongCount: saved.wrongCount || 0,
            accuracy: Math.round(Number(saved.correctCount || 0) / Math.max(1, Number(saved.reviewedCount || 0)) * 100),
            wrongWords: []
          };
        }
      };
      const saveReviewResult = () => {
        const result = {
          correctCount: correctCount.value,
          wrongCount: wrongCount.value,
          accuracy: Math.round(correctCount.value / (correctCount.value + wrongCount.value || 1) * 100) || 0,
          wrongWords: wrongWords.value,
          reviewedCount: correctCount.value + wrongCount.value,
          preset: reviewPreset.value,
          newCount: sessionNewCount.value,
          oldCount: sessionOldCount.value
        };
        uni.setStorageSync(getLastReviewResultKey(), result);
        lastReviewResult.value = result;
      };
      const buildPresetQueue = (list, count) => {
        const preset = reviewPreset.value || "default";
        if (!Array.isArray(list) || !list.length)
          return [];
        if (preset === "wrong") {
          const wrongSet = new Set(getMistakeWords(getCurrentBookId(), true).map((item) => getWordKey(item)));
          return shuffleList(filterWordsByKeys(list, wrongSet)).slice(0, count);
        }
        if (preset === "due" || preset === "firstday") {
          const dueProfiles = getDueProfilesForWords(list, getCurrentBookId());
          const filtered = preset === "firstday" ? dueProfiles.filter((item) => Number(item.first_day_stage || 0) > 0 && Number(item.first_day_stage || 0) < 4) : dueProfiles;
          const dueSet = new Set(filtered.map((item) => getWordKey(item)));
          return shuffleList(filterWordsByKeys(list, dueSet)).slice(0, count);
        }
        return [];
      };
      const buildBookReviewQueue = async (list, count) => {
        if (!Array.isArray(list) || !list.length)
          return [];
        const bookId = getCurrentBookId();
        let filteredList = list;
        if (bookId && bookId !== "self") {
          try {
            const masteredSet = getMasteredWordbookWords(bookId);
            filteredList = list.filter((item) => {
              const english = (item.english || "").trim().toLowerCase();
              return !masteredSet.has(english);
            });
          } catch (e2) {
            formatAppLog("error", "at pages/review/review.vue:1268", "buildBookReviewQueue: 过滤已斯单词失败", e2);
          }
        }
        return shuffleList(filteredList).slice(0, count);
      };
      const saveSettingsAndStart = () => {
        saveSettings();
        showSettings.value = false;
        startReview();
      };
      const startReviewInternal = async (forceCount = null) => {
        ensureDictWords();
        const bookId = getCurrentBookId();
        const oldPlanEntry = getPlanEntry(bookId);
        oldPlanEntry.todayKey === getTodayKey() ? oldPlanEntry.todayKeys : [];
        clearReviewProgress();
        const count = forceCount != null ? Number(forceCount) : Number(settings.value.count || 20);
        if (isSelfWordbook()) {
          if (reviewPreset.value === "default") {
            reviewWords.value = await db.getReviewWords({
              sortBy: settings.value.sortBy,
              count,
              difficulty: "normal"
            });
          } else {
            const allWords = await db.getAllWords();
            reviewWords.value = buildPresetQueue(allWords, count);
          }
        } else {
          const list = await getCurrentBookWordPool2();
          const presetQueue = buildPresetQueue(list, count);
          reviewWords.value = presetQueue.length ? presetQueue : await buildBookReviewQueue(list, count);
        }
        if (reviewWords.value.length === 0) {
          uni.showToast({
            title: "没有单词可复习",
            icon: "none"
          });
          return;
        }
        reviewStarted.value = true;
        reviewFinished.value = false;
        currentIndex.value = 0;
        correctCount.value = 0;
        wrongCount.value = 0;
        wrongWords.value = [];
        sessionNewCount.value = reviewWords.value.filter((item) => !item.__isOldReview).length;
        sessionOldCount.value = reviewWords.value.filter((item) => !!item.__isOldReview).length;
        loadCurrentQuestion();
      };
      const startReview = async () => {
        const progress = loadReviewProgress();
        if (progress) {
          resumeReview();
        } else {
          await startReviewInternal(null);
        }
      };
      const startExtraRound20 = async () => startReviewInternal(20);
      const onPrimaryStartClick = async () => {
        if (isTodayTargetDone.value) {
          await startExtraRound20();
          return;
        }
        await startReview();
      };
      const startRecommendedReview = async () => {
        reviewPreset.value = recommendedPreset.value;
        await startReviewInternal(null);
      };
      const startPresetReview = async (preset) => {
        reviewPreset.value = preset;
        await startReviewInternal(null);
      };
      const prefetchNextWordDetail = (nextIndex) => {
        const nextWord = reviewWords.value[nextIndex];
        if (nextWord && nextWord.english) {
          getWordFullDetail(nextWord.english).catch(() => {
          });
        }
      };
      const loadCurrentQuestion = async () => {
        var _a;
        showResult.value = false;
        showWrongFeedback.value = false;
        selectedOption.value = "";
        userTranslation.value = "";
        aiResult.value = null;
        if (currentIndex.value >= reviewWords.value.length) {
          reviewFinished.value = true;
          return;
        }
        currentWord.value = reviewWords.value[currentIndex.value];
        prefetchNextWordDetail(currentIndex.value + 1);
        if ((_a = currentWord.value) == null ? void 0 : _a.english) {
          try {
            const detail = await getWordFullDetail(currentWord.value.english);
            if (detail) {
              const merged = {
                ...currentWord.value,
                chinese: detail.chinese || currentWord.value.chinese,
                examples: Array.isArray(detail.examples) && detail.examples.length ? detail.examples : currentWord.value.examples || [],
                synonyms: Array.isArray(detail.synonyms) && detail.synonyms.length ? detail.synonyms : currentWord.value.synonyms || [],
                antonyms: Array.isArray(detail.antonyms) && detail.antonyms.length ? detail.antonyms : currentWord.value.antonyms || [],
                defs: Array.isArray(detail.defs) ? detail.defs : currentWord.value.defs || [],
                exam_tip: detail.exam_tip || currentWord.value.exam_tip || ""
              };
              currentWord.value = merged;
              reviewWords.value[currentIndex.value] = merged;
            }
          } catch (_2) {
          }
        }
        spellInput.value = "";
        if (settings.value.mode === "choice") {
          await loadChoiceQuestion();
        } else if (settings.value.mode === "choice_en") {
          await loadChoiceEnQuestion();
        } else if (settings.value.mode === "fill") {
          await loadFillQuestion();
        } else if (settings.value.mode === "ai") {
          await loadAIQuestion();
        } else if (settings.value.mode === "spell")
          ;
      };
      let _dictWordsCache = [];
      let _dictWordsPromise = null;
      const ensureDictWords = () => {
        if (_dictWordsCache.length > 0)
          return Promise.resolve();
        if (_dictWordsPromise)
          return _dictWordsPromise;
        _dictWordsPromise = getWordListForReview().then((list) => {
          _dictWordsCache = list || [];
          _dictWordsPromise = null;
        }).catch(() => {
          _dictWordsPromise = null;
        });
        return _dictWordsPromise;
      };
      const getFormSimilarFromDict = (targetEnglish, count, needChinese) => {
        if (!targetEnglish || !_dictWordsCache.length)
          return needChinese ? [] : [];
        const target = (targetEnglish || "").trim().toLowerCase();
        const len = target.length;
        const pool = _dictWordsCache.filter(
          (item) => item.word && item.chinese && item.word.trim().toLowerCase() !== target
        ).filter((item) => Math.abs((item.word || "").trim().length - len) <= 2);
        const capped = pool.length > 3e3 ? pool.slice(0, 3e3) : pool;
        const scored = capped.map((item) => ({
          word: (item.word || "").trim(),
          chinese: (item.chinese || "").trim(),
          score: formSimilarityScore((item.word || "").trim(), targetEnglish)
        }));
        scored.sort((a2, b2) => b2.score - a2.score);
        const top = scored.slice(0, Math.max(count, 5));
        const pick = top.length <= count ? top : top.slice(0, 5).sort(() => Math.random() - 0.5).slice(0, count);
        return needChinese ? pick.map((p2) => ({ word: p2.word, chinese: p2.chinese })) : pick.map((p2) => p2.word);
      };
      const loadChoiceQuestion = async () => {
        await ensureDictWords();
        const distractors = getFormSimilarFromDict(currentWord.value.english, 3, true);
        let currentWordOption = { chinese: currentWord.value.chinese, pos: "" };
        try {
          const currentDetail = await getWordFullDetail(currentWord.value.english);
          if (currentDetail) {
            if (currentDetail.data_json && currentDetail.data_json.phonetic) {
              currentWord.value.phonetic = currentDetail.data_json.phonetic;
            }
            if (currentDetail.defs && currentDetail.defs.length > 0) {
              const def = currentDetail.defs[0];
              currentWordOption = {
                pos: def.pos || "",
                chinese: def.trans || currentWord.value.chinese
              };
            }
          }
        } catch (e2) {
          formatAppLog("error", "at pages/review/review.vue:1483", "获取当前单词释义失败:", e2);
        }
        const distractorOptions = [];
        for (const d2 of distractors) {
          let option = { pos: "", chinese: d2.chinese };
          try {
            const detail = await getWordFullDetail(d2.word);
            if (detail && detail.defs && detail.defs.length > 0) {
              const def = detail.defs[0];
              option = {
                pos: def.pos || "",
                chinese: def.trans || d2.chinese
              };
            }
          } catch (e2) {
            formatAppLog("error", "at pages/review/review.vue:1500", "获取干扰项释义失败:", e2);
          }
          distractorOptions.push(option);
        }
        const options = [currentWordOption, ...distractorOptions].filter((o2) => o2.chinese);
        const unique = [];
        const seen = /* @__PURE__ */ new Set();
        for (const opt of options) {
          const key = `${opt.pos}:${opt.chinese}`;
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(opt);
          }
        }
        while (unique.length < 4) {
          const extra = getFormSimilarFromDict(currentWord.value.english, 1, true);
          if (extra[0]) {
            let option = { pos: "", chinese: extra[0].chinese };
            try {
              const detail = await getWordFullDetail(extra[0].word);
              if (detail && detail.defs && detail.defs.length > 0) {
                const def = detail.defs[0];
                option = {
                  pos: def.pos || "",
                  chinese: def.trans || extra[0].chinese
                };
              }
            } catch (e2) {
            }
            const key = `${option.pos}:${option.chinese}`;
            if (!seen.has(key)) {
              unique.push(option);
              seen.add(key);
            }
          } else {
            break;
          }
        }
        currentOptions.value = unique.slice(0, 4).sort(() => Math.random() - 0.5);
      };
      const levenshtein = (a2, b2) => {
        if (!a2 || !b2)
          return Math.max((a2 || "").length, (b2 || "").length);
        const m2 = a2.length, n2 = b2.length;
        const dp = Array(m2 + 1).fill(null).map(() => Array(n2 + 1).fill(0));
        for (let i2 = 0; i2 <= m2; i2++)
          dp[i2][0] = i2;
        for (let j2 = 0; j2 <= n2; j2++)
          dp[0][j2] = j2;
        for (let i2 = 1; i2 <= m2; i2++) {
          for (let j2 = 1; j2 <= n2; j2++) {
            const cost = a2[i2 - 1].toLowerCase() === b2[j2 - 1].toLowerCase() ? 0 : 1;
            dp[i2][j2] = Math.min(dp[i2 - 1][j2] + 1, dp[i2][j2 - 1] + 1, dp[i2 - 1][j2 - 1] + cost);
          }
        }
        return dp[m2][n2];
      };
      const formSimilarityScore = (eng, target) => {
        if (!eng || !target)
          return 0;
        const a2 = eng.trim().toLowerCase();
        const b2 = target.trim().toLowerCase();
        if (a2 === b2)
          return -1e9;
        let score = 0;
        const lenDiff = Math.abs(a2.length - b2.length);
        if (lenDiff === 0)
          score += 10;
        else if (lenDiff === 1)
          score += 5;
        if (a2.slice(0, 2) === b2.slice(0, 2))
          score += 4;
        if (a2.length >= 2 && b2.length >= 2 && a2.slice(-2) === b2.slice(-2))
          score += 4;
        score -= levenshtein(a2, b2);
        return score;
      };
      const getFormSimilarDistractors = (targetEnglish, wordList, count = 3) => {
        const pool = (wordList || []).filter((w2) => {
          var _a;
          return w2.id !== ((_a = currentWord.value) == null ? void 0 : _a.id) && w2.english;
        }).map((w2) => typeof w2.english === "string" ? w2.english.trim() : "").filter((eng) => eng && eng.toLowerCase() !== (targetEnglish || "").trim().toLowerCase());
        if (pool.length === 0)
          return [];
        const scored = pool.map((eng) => ({ eng, score: formSimilarityScore(eng, targetEnglish) }));
        scored.sort((x, y2) => y2.score - x.score);
        const top = scored.slice(0, Math.max(count, scored.length));
        const pick = top.length <= count ? top : top.slice(0, 5).sort(() => Math.random() - 0.5).slice(0, count);
        return pick.map((p2) => p2.eng);
      };
      const loadChoiceEnQuestion = async () => {
        var _a;
        await ensureDictWords();
        const target = (_a = currentWord.value) == null ? void 0 : _a.english;
        const distractors = getFormSimilarFromDict(target, 3, false);
        const options = [target, ...distractors].filter(Boolean);
        const unique = [...new Set(options)];
        while (unique.length < 4) {
          const extra = getFormSimilarFromDict(target, 1, false);
          if (extra[0] && !unique.includes(extra[0]))
            unique.push(extra[0]);
          else
            break;
        }
        currentOptions.value = unique.slice(0, 4).sort(() => Math.random() - 0.5);
      };
      const loadFillQuestion = async () => {
        const examples = currentWord.value.examples || [];
        currentFillSentenceChinese.value = "";
        if (examples.length === 0) {
          currentSentence.value = "暂无例句";
          fillAnswer.value = currentWord.value.english;
          fillOptions.value = [currentWord.value.english];
          return;
        }
        const randomExample = examples[Math.floor(Math.random() * examples.length)];
        const sentence = randomExample.english;
        const targetWord = currentWord.value.english;
        currentFillSentenceChinese.value = randomExample.chinese || "";
        const blankSentence = sentence.replace(new RegExp(`\\b${escapeRegExp(targetWord)}\\b`, "gi"), "____");
        currentSentence.value = blankSentence;
        fillAnswer.value = targetWord;
        await ensureDictWords();
        const otherWords = getFormSimilarFromDict(targetWord, 3, false);
        fillOptions.value = [...otherWords, targetWord].filter(Boolean);
        const unique = [...new Set(fillOptions.value)];
        while (unique.length < 4) {
          const extra = getFormSimilarFromDict(targetWord, 1, false);
          if (extra[0] && !unique.includes(extra[0]))
            unique.push(extra[0]);
          else
            break;
        }
        fillOptions.value = unique.slice(0, 4).sort(() => Math.random() - 0.5);
      };
      const loadAIQuestion = async () => {
        isGenerating.value = true;
        aiSentence.value = "";
        try {
          const word = currentWord.value.english;
          const prompt = `你是一个考研英语名师。请为单词 '${word}' 生成一句符合考研难度、简短且地道的英文例句。只需返回纯英文句子，不要任何解释和标点符号外的多余字符。`;
          const response = await aiService.callAPI(prompt);
          aiSentence.value = response.trim();
        } catch (error) {
          formatAppLog("error", "at pages/review/review.vue:1650", "生成例句失败:", error);
          aiSentence.value = "生成例句失败，请重试";
        } finally {
          isGenerating.value = false;
        }
      };
      const queueRetryWord = () => {
        const key = getWordKey(currentWord.value);
        if (!key)
          return;
        const retryCount = Number(currentWord.value.__retryCount || 0);
        if (retryCount >= 1)
          return;
        reviewWords.value.push({
          ...currentWord.value,
          __retryCount: retryCount + 1,
          __isOldReview: true,
          __fromWrongRetry: true
        });
      };
      const applyReviewOutcome = async (isCorrect, wrongPayload = null) => {
        recordReviewOutcome(currentWord.value, isCorrect, {
          bookId: getCurrentBookId(),
          mode: settings.value.mode,
          source: "review"
        });
        if (currentWord.value.id) {
          await db.updateErrorRate(currentWord.value.id, isCorrect);
          applyReviewPreview(isCorrect);
        }
        if (isCorrect) {
          correctCount.value++;
          return;
        }
        wrongCount.value++;
        queueRetryWord();
        if (wrongPayload) {
          wrongWords.value.push(wrongPayload);
        }
      };
      const submitAnswer = async () => {
        if (!userTranslation.value.trim() || isSubmitting.value)
          return;
        isSubmitting.value = true;
        try {
          const word = currentWord.value.english;
          const sentence = aiSentence.value;
          const userInput = userTranslation.value.trim();
          const prompt = `目标单词：'${word}'。英文例句：'${sentence}'。学生输入该词在此句中的中文意思：'${userInput}'。

请以宽松、包容的标准判分：只要学生表达的意思与目标词在本句中的含义相近、同义、或合理意译，就应判为正确（is_correct: true）。只有明显错误、完全偏离才判错。
请同时给出该英文例句的完整中文翻译。
严格返回 JSON，不要其他内容：{"is_correct": true或false, "explanation": "简短解析", "sentence_chinese": "整句中文翻译"}`;
          const response = await aiService.callAPI(prompt);
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            aiResult.value = {
              is_correct: !!parsed.is_correct,
              explanation: parsed.explanation || "解析失败",
              sentence_chinese: parsed.sentence_chinese || ""
            };
          } else {
            aiResult.value = { is_correct: false, explanation: "解析失败，请重试", sentence_chinese: "" };
          }
          showResult.value = true;
          markWordsReviewed(currentWord.value);
          if (aiResult.value.is_correct) {
            await applyReviewOutcome(true);
          } else {
            await applyReviewOutcome(false, {
              english: currentWord.value.english,
              chinese: currentWord.value.chinese,
              yourAnswer: userInput,
              explanation: aiResult.value.explanation,
              synonyms: currentWord.value.synonyms || []
            });
          }
        } catch (error) {
          formatAppLog("error", "at pages/review/review.vue:1739", "提交答案失败:", error);
          uni.showToast({
            title: "AI判卷失败，请重试",
            icon: "none"
          });
        } finally {
          isSubmitting.value = false;
        }
      };
      const handleChoice = async (option) => {
        selectedOption.value = option;
        showResult.value = true;
        markWordsReviewed(currentWord.value);
        const optionChinese = typeof option === "object" ? option.chinese : option;
        let isCorrect = false;
        if (currentWord.value.defs && currentWord.value.defs.length > 0) {
          const firstDef = currentWord.value.defs[0];
          isCorrect = optionChinese === (firstDef.trans || currentWord.value.chinese);
        } else {
          isCorrect = optionChinese === currentWord.value.chinese;
        }
        if (isCorrect) {
          await applyReviewOutcome(true);
        } else {
          await applyReviewOutcome(false, {
            english: currentWord.value.english,
            chinese: currentWord.value.chinese,
            yourAnswer: optionChinese,
            synonyms: currentWord.value.synonyms || []
          });
        }
      };
      const handleChoiceEn = async (option) => {
        selectedOption.value = option;
        showResult.value = true;
        markWordsReviewed(currentWord.value);
        const correct = (option || "").trim().toLowerCase() === (currentWord.value.english || "").trim().toLowerCase();
        if (correct) {
          await applyReviewOutcome(true);
        } else {
          await applyReviewOutcome(false, {
            english: currentWord.value.english,
            chinese: currentWord.value.chinese,
            yourAnswer: option,
            synonyms: currentWord.value.synonyms || []
          });
        }
      };
      const handleFillChoice = async (option) => {
        selectedOption.value = option;
        showResult.value = true;
        markWordsReviewed(currentWord.value);
        if (option === fillAnswer.value) {
          await applyReviewOutcome(true);
        } else {
          await applyReviewOutcome(false, {
            english: currentWord.value.english,
            chinese: currentWord.value.chinese,
            yourAnswer: option,
            correctAnswer: fillAnswer.value,
            synonyms: currentWord.value.synonyms || []
          });
        }
      };
      const handleSpellSubmit = async () => {
        const input = (spellInput.value || "").trim().toLowerCase();
        if (!input)
          return;
        const correct = input === (currentWord.value.english || "").trim().toLowerCase();
        showResult.value = true;
        markWordsReviewed(currentWord.value);
        if (correct) {
          await applyReviewOutcome(true);
        } else {
          await applyReviewOutcome(false, {
            english: currentWord.value.english,
            chinese: currentWord.value.chinese,
            yourAnswer: spellInput.value.trim(),
            correctAnswer: currentWord.value.english,
            synonyms: currentWord.value.synonyms || []
          });
        }
      };
      const nextQuestion = () => {
        if (currentIndex.value >= reviewWords.value.length - 1) {
          finishReview();
          return;
        }
        currentIndex.value++;
        saveReviewProgress();
        loadCurrentQuestion();
      };
      const finishReview = () => {
        reviewFinished.value = true;
        clearReviewProgress();
        saveReviewResult();
        logStudySession({
          bookId: getCurrentBookId(),
          mode: settings.value.mode,
          preset: reviewPreset.value,
          reviewedCount: correctCount.value + wrongCount.value,
          correctCount: correctCount.value,
          wrongCount: wrongCount.value,
          newCount: sessionNewCount.value,
          oldCount: sessionOldCount.value,
          mistakeCount: wrongWords.value.length
        });
        refreshPlanStats();
      };
      const restartReview = () => {
        onPrimaryStartClick();
      };
      const goBack = () => {
        uni.navigateBack();
      };
      const goToWordDetail = () => {
        if (!currentWord.value) {
          uni.showToast({ title: "无法查看详情", icon: "none" });
          return;
        }
        saveReviewProgress();
        uni.navigateTo({
          url: `/pages/word-detail/word-detail?english=${encodeURIComponent(currentWord.value.english)}&source=masterdb`,
          fail: (err) => {
            formatAppLog("error", "at pages/review/review.vue:1883", "跳转失败:", err);
            uni.showToast({ title: "跳转失败", icon: "none" });
          }
        });
      };
      const markCurrentWordAsMastered = async () => {
        if (!currentWord.value || !currentWord.value.english) {
          uni.showToast({ title: "无法斩掉该单词", icon: "none" });
          showMasteredConfirm.value = false;
          return;
        }
        try {
          const bookId = getCurrentBookId();
          if (currentWord.value.id) {
            formatAppLog("log", "at pages/review/review.vue:1902", "markCurrentWordAsMastered: 自用词库单词，使用id斯掉");
            await db.masterWord(currentWord.value.id);
          } else if (bookId && bookId !== "self") {
            formatAppLog("log", "at pages/review/review.vue:1906", "markCurrentWordAsMastered: 词书单词，存储到本地");
            addMasteredWordbookWord(bookId, currentWord.value.english);
          } else {
            formatAppLog("log", "at pages/review/review.vue:1910", "markCurrentWordAsMastered: 其他情况，使用english斯掉");
            await db.masterWordByEnglish(currentWord.value.english);
          }
          formatAppLog("log", "at pages/review/review.vue:1914", "markCurrentWordAsMastered: 斯掉成功");
          uni.showToast({ title: "已斯掉！", icon: "success" });
          showMasteredConfirm.value = false;
          setTimeout(() => {
            nextQuestion();
          }, 500);
        } catch (error) {
          formatAppLog("error", "at pages/review/review.vue:1923", "markCurrentWordAsMastered: 斯掉失败", error);
          uni.showToast({ title: "斯掉失败: " + (error.message || "未知错误"), icon: "none" });
          showMasteredConfirm.value = false;
        }
      };
      const backToStartScreen = () => {
        saveReviewProgress();
        checkProgress();
        reviewStarted.value = false;
        reviewFinished.value = false;
        selectedOption.value = "";
        showResult.value = false;
        showWrongFeedback.value = false;
        userTranslation.value = "";
        aiResult.value = null;
      };
      onBackPress(() => {
        if (reviewStarted.value && !reviewFinished.value) {
          backToStartScreen();
          return true;
        }
        return false;
      });
      const __returned__ = { showSettings, showModeSelector, showSortSelector, showCountSelector, showDifficultySelector, reviewStarted, reviewFinished, settings, reviewWords, currentIndex, currentWord, currentOptions, fillOptions, currentFillSentenceChinese, spellInput, escapeRegExp, formatHighlight, currentSentence, fillAnswer, aiSentence, userTranslation, aiResult, isGenerating, isSubmitting, formatAIPhighlight, selectedOption, showResult, showWrongFeedback, correctCount, wrongCount, wrongWords, lastReviewResult, showResumeModal, hasProgress, activeSettingCard, dashboardDone, dashboardTotal, bookTotalWords, totalReviewedWords, todayReviewed, learnedUniqueWords, dashboardSnapshot, showMasteredConfirm, reviewPreset, sessionNewCount, sessionOldCount, REVIEW_PLAN_KEY, getReviewProgressKey, getSettingsKey, getLastReviewResultKey, getWordKey, uniqueWordKeys, saveReviewProgress, clearReviewProgress, loadReviewProgress, resumeReview, discardReview, checkProgress, getTodayKey, normalizePlanEntry, loadPlanStore, savePlanStore, getCurrentBookId, getPlanEntry, savePlanEntry, getCurrentBookTotalWords, getCurrentBookWordPool: getCurrentBookWordPool2, filterWordsByKeys, refreshDashboardSnapshot, refreshPlanStats, resetCurrentPlan, markWordsReviewed, getOldReviewQuota, shuffleList, interleaveOldWords, syncDashboardProgress, dashboardTarget, dashboardPercent, formatRelativeReviewTime, currentReviewInsight, applyReviewPreview, finishedReviewInsight, completedInRound, currentRound, currentProgressPercent, oldReviewDailyTarget, dailyNewTarget, remainDays, remainingNewWords, estimatedFinishDate, dailyPlanText, isTodayTargetDone, primaryStartText, todayProgressPercent, recommendedPreset, recommendedPresetIcon, recommendedPresetTitle, recommendedPresetDesc, otherPresets, currentWordbookName, openSettings, sortByText, isLastQuestion, modeOptions, sortOptions, countOptions, dailyQuickOptions, modeIndex, modeDisplayText, sortIndex, countIndex, onModeChange, onSortChange, onCountChange, setDailyTarget, onDifficultyChange, openModeSelector, openSortSelector, openCountSelector, openDifficultySelector, loadSettings, saveSettings, loadLastReviewResult, saveReviewResult, buildPresetQueue, buildBookReviewQueue, saveSettingsAndStart, startReviewInternal, startReview, startExtraRound20, onPrimaryStartClick, startRecommendedReview, startPresetReview, prefetchNextWordDetail, loadCurrentQuestion, get _dictWordsCache() {
        return _dictWordsCache;
      }, set _dictWordsCache(v2) {
        _dictWordsCache = v2;
      }, get _dictWordsPromise() {
        return _dictWordsPromise;
      }, set _dictWordsPromise(v2) {
        _dictWordsPromise = v2;
      }, ensureDictWords, getFormSimilarFromDict, loadChoiceQuestion, levenshtein, formSimilarityScore, getFormSimilarDistractors, loadChoiceEnQuestion, loadFillQuestion, loadAIQuestion, queueRetryWord, applyReviewOutcome, submitAnswer, handleChoice, handleChoiceEn, handleFillChoice, handleSpellSubmit, nextQuestion, finishReview, restartReview, goBack, goToWordDetail, markCurrentWordAsMastered, backToStartScreen, ref: vue.ref, computed: vue.computed, onMounted: vue.onMounted, get onBackPress() {
        return onBackPress;
      }, get onShow() {
        return onShow;
      }, get onHide() {
        return onHide;
      }, get onUnload() {
        return onUnload;
      }, get onLoad() {
        return onLoad;
      }, get db() {
        return db;
      }, get aiService() {
        return aiService;
      }, get masterDb() {
        return masterDb;
      }, get getCurrentWordbook() {
        return getCurrentWordbook;
      }, get getWordbookListForUI() {
        return getWordbookListForUI;
      }, get isSelfWordbook() {
        return isSelfWordbook;
      }, get isLocalWordbookKey() {
        return isLocalWordbookKey;
      }, get loadLocalWordbook() {
        return loadLocalWordbook;
      }, get getWordbookWords() {
        return getWordbookWords;
      }, get recordReviewOutcome() {
        return recordReviewOutcome;
      }, get getLearningDashboard() {
        return getLearningDashboard;
      }, get getMistakeWords() {
        return getMistakeWords;
      }, get getDueProfilesForWords() {
        return getDueProfilesForWords;
      }, get getLatestSession() {
        return getLatestSession;
      }, get logStudySession() {
        return logStudySession;
      }, get logger() {
        return logger;
      }, get errorHandler() {
        return errorHandler;
      }, get cleanupExpiredCaches() {
        return cleanupExpiredCaches;
      }, get getMasteredWordbookWords() {
        return getMasteredWordbookWords;
      }, get addMasteredWordbookWord() {
        return addMasteredWordbookWord;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$9(_ctx, _cache, $props, $setup, $data, $options) {
    var _a, _b, _c, _d;
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      !$setup.reviewStarted ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "custom-nav-bar"
      }, [
        vue.createElementVNode("view", {
          class: "nav-back-btn",
          onClick: $setup.goBack
        }, "‹"),
        vue.createElementVNode(
          "text",
          { class: "nav-title" },
          vue.toDisplayString($setup.currentWordbookName),
          1
          /* TEXT */
        ),
        vue.createElementVNode("view", {
          class: "nav-settings-btn",
          onClick: _cache[0] || (_cache[0] = ($event) => $setup.showSettings = true)
        }, "⚙")
      ])) : vue.createCommentVNode("v-if", true),
      !$setup.reviewStarted ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "start-review-fixed"
      }, [
        vue.createElementVNode("view", { class: "section-label" }, "今日进度"),
        vue.createElementVNode("view", { class: "card stat-card-large" }, [
          vue.createElementVNode("view", { class: "stat-value-large" }, [
            vue.createElementVNode(
              "text",
              { class: "stat-number" },
              vue.toDisplayString($setup.todayReviewed),
              1
              /* TEXT */
            ),
            vue.createElementVNode(
              "text",
              { class: "stat-sep" },
              "/ " + vue.toDisplayString($setup.settings.count),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "stat-bar" }, [
            vue.createElementVNode(
              "view",
              {
                class: "stat-bar-fill",
                style: vue.normalizeStyle({ width: $setup.todayReviewed / $setup.settings.count * 100 + "%" })
              },
              null,
              4
              /* STYLE */
            )
          ]),
          vue.createElementVNode(
            "view",
            { class: "stat-detail-row" },
            "新学 " + vue.toDisplayString($setup.sessionNewCount) + " · 复习 " + vue.toDisplayString($setup.sessionOldCount),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "section-label" }, "词书进度"),
        vue.createElementVNode("view", { class: "card stat-card-large" }, [
          vue.createElementVNode("view", { class: "stat-header-row" }, [
            vue.createElementVNode(
              "text",
              { class: "stat-left-text" },
              "已学 " + vue.toDisplayString($setup.learnedUniqueWords) + " / " + vue.toDisplayString($setup.bookTotalWords) + " 词",
              1
              /* TEXT */
            ),
            vue.createElementVNode(
              "text",
              { class: "stat-right-text" },
              vue.toDisplayString($setup.currentProgressPercent) + "%",
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "stat-bar" }, [
            vue.createElementVNode(
              "view",
              {
                class: "stat-bar-fill",
                style: vue.normalizeStyle({ width: $setup.currentProgressPercent + "%" })
              },
              null,
              4
              /* STYLE */
            )
          ]),
          vue.createElementVNode(
            "view",
            { class: "stat-detail-row" },
            "剩余 " + vue.toDisplayString($setup.remainingNewWords) + " 词 · 预计 " + vue.toDisplayString($setup.remainDays) + " 天完成",
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "section-label" }, "推荐复习"),
        vue.createElementVNode("view", {
          class: "card recommend-card",
          onClick: $setup.startRecommendedReview
        }, [
          vue.createElementVNode("view", { class: "recommend-info" }, [
            vue.createElementVNode(
              "text",
              { class: "recommend-title" },
              vue.toDisplayString($setup.recommendedPresetTitle),
              1
              /* TEXT */
            ),
            vue.createElementVNode(
              "text",
              { class: "recommend-desc" },
              vue.toDisplayString($setup.recommendedPresetDesc),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("button", { class: "start-btn" }, "开始复习")
        ]),
        vue.createElementVNode("view", { class: "section-label" }, "其他复习方式"),
        vue.createElementVNode("view", { class: "other-buttons" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.otherPresets, (preset) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: preset.key,
                class: "card other-btn",
                onClick: ($event) => $setup.startPresetReview(preset.key)
              }, [
                vue.createElementVNode(
                  "text",
                  { class: "btn-title" },
                  vue.toDisplayString(preset.title),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "btn-count" },
                  vue.toDisplayString(preset.count) + "个",
                  1
                  /* TEXT */
                )
              ], 8, ["onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ])
      ])) : vue.createCommentVNode("v-if", true),
      $setup.showSettings ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 2,
        class: "modal-overlay",
        onClick: _cache[14] || (_cache[14] = ($event) => $setup.showSettings = false)
      }, [
        vue.createElementVNode("view", {
          class: "settings-modal",
          onClick: _cache[13] || (_cache[13] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode("view", { class: "modal-header" }, [
            vue.createElementVNode("text", { class: "modal-title" }, "复习设置"),
            vue.createElementVNode("view", {
              class: "modal-close",
              onClick: _cache[1] || (_cache[1] = ($event) => $setup.showSettings = false)
            }, "✕")
          ]),
          vue.createElementVNode("view", { class: "settings-cards-grid" }, [
            vue.createElementVNode("view", {
              class: "settings-card",
              onClick: $setup.openModeSelector
            }, [
              vue.createElementVNode("text", { class: "card-title" }, "复习模式"),
              vue.createElementVNode(
                "text",
                { class: "card-description" },
                vue.toDisplayString($setup.modeDisplayText),
                1
                /* TEXT */
              ),
              vue.createElementVNode("view", { class: "card-arrow-icon" }, "›")
            ]),
            vue.createElementVNode("view", {
              class: "settings-card",
              onClick: $setup.openSortSelector
            }, [
              vue.createElementVNode("text", { class: "card-title" }, "排序方式"),
              vue.createElementVNode(
                "text",
                { class: "card-description" },
                vue.toDisplayString($setup.sortByText),
                1
                /* TEXT */
              ),
              vue.createElementVNode("view", { class: "card-arrow-icon" }, "›")
            ]),
            vue.createElementVNode("view", {
              class: "settings-card",
              onClick: $setup.openCountSelector
            }, [
              vue.createElementVNode("text", { class: "card-title" }, "复习数量"),
              vue.createElementVNode(
                "text",
                { class: "card-description" },
                vue.toDisplayString($setup.settings.count) + " 个",
                1
                /* TEXT */
              ),
              vue.createElementVNode("view", { class: "card-arrow-icon" }, "›")
            ]),
            vue.createElementVNode("view", {
              class: "settings-card",
              onClick: $setup.openDifficultySelector
            }, [
              vue.createElementVNode("text", { class: "card-title" }, "复习难度"),
              vue.createElementVNode(
                "text",
                { class: "card-description" },
                vue.toDisplayString($setup.settings.difficulty === "hard" ? "困难" : "标准"),
                1
                /* TEXT */
              ),
              vue.createElementVNode("view", { class: "card-arrow-icon" }, "›")
            ])
          ]),
          $setup.showModeSelector ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "selector-overlay",
            onClick: _cache[3] || (_cache[3] = ($event) => $setup.showModeSelector = false)
          }, [
            vue.createElementVNode("view", {
              class: "selector-modal",
              onClick: _cache[2] || (_cache[2] = vue.withModifiers(() => {
              }, ["stop"]))
            }, [
              vue.createElementVNode("text", { class: "selector-title" }, "选择复习模式"),
              vue.createElementVNode("view", { class: "selector-options" }, [
                (vue.openBlock(), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList($setup.modeOptions, (name, idx) => {
                    return vue.createElementVNode("view", {
                      key: "mode-" + idx,
                      class: vue.normalizeClass(["selector-item", { active: $setup.modeIndex === idx }]),
                      onClick: ($event) => {
                        $setup.onModeChange({ detail: { value: idx } });
                        $setup.showModeSelector = false;
                      }
                    }, vue.toDisplayString(name), 11, ["onClick"]);
                  }),
                  64
                  /* STABLE_FRAGMENT */
                ))
              ])
            ])
          ])) : vue.createCommentVNode("v-if", true),
          $setup.showSortSelector ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "selector-overlay",
            onClick: _cache[5] || (_cache[5] = ($event) => $setup.showSortSelector = false)
          }, [
            vue.createElementVNode("view", {
              class: "selector-modal",
              onClick: _cache[4] || (_cache[4] = vue.withModifiers(() => {
              }, ["stop"]))
            }, [
              vue.createElementVNode("text", { class: "selector-title" }, "选择排序方式"),
              vue.createElementVNode("view", { class: "selector-options" }, [
                (vue.openBlock(), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList($setup.sortOptions, (name, idx) => {
                    return vue.createElementVNode("view", {
                      key: "sort-" + idx,
                      class: vue.normalizeClass(["selector-item", { active: $setup.sortIndex === idx }]),
                      onClick: ($event) => {
                        $setup.onSortChange({ detail: { value: idx } });
                        $setup.showSortSelector = false;
                      }
                    }, vue.toDisplayString(name), 11, ["onClick"]);
                  }),
                  64
                  /* STABLE_FRAGMENT */
                ))
              ])
            ])
          ])) : vue.createCommentVNode("v-if", true),
          $setup.showCountSelector ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 2,
            class: "selector-overlay",
            onClick: _cache[7] || (_cache[7] = ($event) => $setup.showCountSelector = false)
          }, [
            vue.createElementVNode("view", {
              class: "selector-modal",
              onClick: _cache[6] || (_cache[6] = vue.withModifiers(() => {
              }, ["stop"]))
            }, [
              vue.createElementVNode("text", { class: "selector-title" }, "选择复习数量"),
              vue.createElementVNode("view", { class: "selector-options" }, [
                (vue.openBlock(), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList($setup.countOptions, (n2) => {
                    return vue.createElementVNode("view", {
                      key: "count-" + n2,
                      class: vue.normalizeClass(["selector-item", { active: $setup.settings.count === n2 }]),
                      onClick: ($event) => {
                        $setup.setDailyTarget(n2);
                        $setup.showCountSelector = false;
                      }
                    }, vue.toDisplayString(n2) + " 个 ", 11, ["onClick"]);
                  }),
                  64
                  /* STABLE_FRAGMENT */
                ))
              ])
            ])
          ])) : vue.createCommentVNode("v-if", true),
          $setup.showDifficultySelector ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 3,
            class: "selector-overlay",
            onClick: _cache[11] || (_cache[11] = ($event) => $setup.showDifficultySelector = false)
          }, [
            vue.createElementVNode("view", {
              class: "selector-modal",
              onClick: _cache[10] || (_cache[10] = vue.withModifiers(() => {
              }, ["stop"]))
            }, [
              vue.createElementVNode("text", { class: "selector-title" }, "选择复习难度"),
              vue.createElementVNode("view", { class: "selector-options" }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: vue.normalizeClass(["selector-item", { active: $setup.settings.difficulty === "normal" }]),
                    onClick: _cache[8] || (_cache[8] = ($event) => {
                      $setup.onDifficultyChange("normal");
                      $setup.showDifficultySelector = false;
                    })
                  },
                  " 标准 ",
                  2
                  /* CLASS */
                ),
                vue.createElementVNode(
                  "view",
                  {
                    class: vue.normalizeClass(["selector-item", { active: $setup.settings.difficulty === "hard" }]),
                    onClick: _cache[9] || (_cache[9] = ($event) => {
                      $setup.onDifficultyChange("hard");
                      $setup.showDifficultySelector = false;
                    })
                  },
                  " 困难 ",
                  2
                  /* CLASS */
                )
              ])
            ])
          ])) : vue.createCommentVNode("v-if", true),
          vue.createElementVNode("view", { class: "modal-actions" }, [
            vue.createElementVNode("button", {
              class: "modal-btn",
              onClick: _cache[12] || (_cache[12] = ($event) => $setup.showSettings = false)
            }, "关闭")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      $setup.showResumeModal ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 3,
        class: "modal-overlay",
        onClick: vue.withModifiers($setup.discardReview, ["self"])
      }, [
        vue.createElementVNode("view", {
          class: "resume-modal",
          onClick: _cache[15] || (_cache[15] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode("text", { class: "modal-title" }, "发现未完成的复习"),
          vue.createElementVNode("text", { class: "resume-text" }, "是否继续上次的复习？"),
          vue.createElementVNode("view", { class: "modal-actions" }, [
            vue.createElementVNode("button", {
              class: "modal-btn secondary",
              onClick: $setup.discardReview
            }, "放弃"),
            vue.createElementVNode("button", {
              class: "modal-btn primary",
              onClick: $setup.resumeReview
            }, "继续")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      $setup.showMasteredConfirm ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 4,
        class: "modal-overlay",
        onClick: _cache[18] || (_cache[18] = ($event) => $setup.showMasteredConfirm = false)
      }, [
        vue.createElementVNode("view", {
          class: "resume-modal",
          onClick: _cache[17] || (_cache[17] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode("text", { class: "modal-title" }, "斩掉这个单词？"),
          vue.createElementVNode(
            "text",
            { class: "resume-text" },
            vue.toDisplayString($setup.currentWord.english) + " - " + vue.toDisplayString($setup.currentWord.chinese),
            1
            /* TEXT */
          ),
          vue.createElementVNode("text", {
            class: "resume-text",
            style: { "font-size": "13px", "color": "#A1A1AA" }
          }, "斩掉后该单词将在复习中隐藏"),
          vue.createElementVNode("view", { class: "modal-actions" }, [
            vue.createElementVNode("button", {
              class: "modal-btn secondary",
              onClick: _cache[16] || (_cache[16] = ($event) => $setup.showMasteredConfirm = false)
            }, "取消"),
            vue.createElementVNode("button", {
              class: "modal-btn primary",
              onClick: $setup.markCurrentWordAsMastered
            }, "确认斩掉")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      $setup.showMasteredConfirm ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 5,
        class: "modal-overlay",
        onClick: _cache[21] || (_cache[21] = ($event) => $setup.showMasteredConfirm = false)
      }, [
        vue.createElementVNode("view", {
          class: "resume-modal",
          onClick: _cache[20] || (_cache[20] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode("text", { class: "modal-title" }, "斩掉这个单词？"),
          vue.createElementVNode(
            "text",
            { class: "resume-text" },
            vue.toDisplayString($setup.currentWord.english) + " - " + vue.toDisplayString($setup.currentWord.chinese),
            1
            /* TEXT */
          ),
          vue.createElementVNode("text", {
            class: "resume-text",
            style: { "font-size": "13px", "color": "#A1A1AA" }
          }, "斩掉后该单词将在复习中隐藏"),
          vue.createElementVNode("view", { class: "modal-actions" }, [
            vue.createElementVNode("button", {
              class: "modal-btn secondary",
              onClick: _cache[19] || (_cache[19] = ($event) => $setup.showMasteredConfirm = false)
            }, "取消"),
            vue.createElementVNode("button", {
              class: "modal-btn primary",
              onClick: $setup.markCurrentWordAsMastered
            }, "确认斩掉")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      $setup.reviewStarted && !$setup.reviewFinished ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 6,
        class: "stats-bar"
      }, [
        vue.createElementVNode("view", {
          class: "stats-back-btn",
          onClick: $setup.backToStartScreen
        }, "‹"),
        vue.createElementVNode("view", { class: "stats-info" }, [
          vue.createElementVNode(
            "text",
            null,
            vue.toDisplayString($setup.currentIndex + 1) + "/" + vue.toDisplayString($setup.reviewWords.length),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "text",
            null,
            "正确 " + vue.toDisplayString($setup.correctCount),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "text",
            null,
            "错误 " + vue.toDisplayString($setup.wrongCount),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", {
          class: "stats-action-btn",
          onClick: _cache[22] || (_cache[22] = ($event) => $setup.showMasteredConfirm = true)
        }, "斩")
      ])) : vue.createCommentVNode("v-if", true),
      $setup.reviewStarted && !$setup.reviewFinished && $setup.currentReviewInsight ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 7,
        class: "review-insight-strip"
      }, [
        vue.createElementVNode("view", { class: "insight-chip" }, [
          vue.createElementVNode("text", { class: "insight-label" }, "掌握度"),
          vue.createElementVNode(
            "text",
            { class: "insight-value" },
            vue.toDisplayString($setup.currentReviewInsight.mastery) + "%",
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "insight-chip" }, [
          vue.createElementVNode("text", { class: "insight-label" }, "下次复习"),
          vue.createElementVNode(
            "text",
            { class: "insight-value" },
            vue.toDisplayString($setup.currentReviewInsight.nextReviewText),
            1
            /* TEXT */
          )
        ])
      ])) : vue.createCommentVNode("v-if", true),
      $setup.reviewStarted && $setup.currentWord && !$setup.reviewFinished ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 8,
        class: "content"
      }, [
        $setup.settings.mode === "choice" ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "choice-mode"
        }, [
          $setup.currentWord.__isOldReview ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "review-word-flag"
          }, "复习巩固")) : vue.createCommentVNode("v-if", true),
          vue.createElementVNode("view", { class: "word-display" }, [
            vue.createElementVNode(
              "view",
              { class: "word-english" },
              vue.toDisplayString($setup.currentWord.english),
              1
              /* TEXT */
            ),
            $setup.currentWord.phonetic ? (vue.openBlock(), vue.createElementBlock(
              "view",
              {
                key: 0,
                class: "word-phonetic"
              },
              "/" + vue.toDisplayString($setup.currentWord.phonetic) + "/",
              1
              /* TEXT */
            )) : vue.createCommentVNode("v-if", true)
          ]),
          vue.createElementVNode("view", { class: "options-grid" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.currentOptions, (option, idx) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: idx,
                  class: vue.normalizeClass(["option-card", {
                    "correct": $setup.showResult && $setup.currentWord.defs && $setup.currentWord.defs.length > 0 && option.chinese === $setup.currentWord.defs[0].trans,
                    "wrong": $setup.showResult && $setup.selectedOption && option.chinese === $setup.selectedOption.chinese && !($setup.currentWord.defs && $setup.currentWord.defs.length > 0 && option.chinese === $setup.currentWord.defs[0].trans)
                  }]),
                  onClick: ($event) => !$setup.showResult && $setup.handleChoice(option)
                }, [
                  vue.createElementVNode("view", { class: "option-content" }, [
                    option.pos ? (vue.openBlock(), vue.createElementBlock(
                      "text",
                      {
                        key: 0,
                        class: "option-pos"
                      },
                      vue.toDisplayString(option.pos),
                      1
                      /* TEXT */
                    )) : vue.createCommentVNode("v-if", true),
                    vue.createElementVNode(
                      "text",
                      { class: "option-text" },
                      vue.toDisplayString(option.chinese),
                      1
                      /* TEXT */
                    )
                  ])
                ], 10, ["onClick"]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]),
          $setup.showResult ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "action-buttons"
          }, [
            vue.createElementVNode("view", {
              class: "action-btn",
              onClick: $setup.goToWordDetail
            }, "详情"),
            vue.createElementVNode(
              "view",
              {
                class: "action-btn",
                onClick: $setup.nextQuestion
              },
              vue.toDisplayString($setup.isLastQuestion ? "查看结果" : "下一题 →"),
              1
              /* TEXT */
            )
          ])) : vue.createCommentVNode("v-if", true)
        ])) : vue.createCommentVNode("v-if", true),
        $setup.settings.mode === "choice_en" ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "choice-mode"
        }, [
          $setup.currentWord.__isOldReview ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "review-word-flag"
          }, "复习巩固")) : vue.createCommentVNode("v-if", true),
          vue.createElementVNode(
            "view",
            { class: "word-chinese-prompt" },
            vue.toDisplayString($setup.currentWord.chinese),
            1
            /* TEXT */
          ),
          vue.createElementVNode("view", { class: "options-grid" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.currentOptions, (option, idx) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: idx,
                  class: vue.normalizeClass(["option-card", {
                    "correct": $setup.showResult && (option || "").trim().toLowerCase() === ($setup.currentWord.english || "").trim().toLowerCase(),
                    "wrong": $setup.showResult && option === $setup.selectedOption && (option || "").trim().toLowerCase() !== ($setup.currentWord.english || "").trim().toLowerCase()
                  }]),
                  onClick: ($event) => !$setup.showResult && $setup.handleChoiceEn(option)
                }, [
                  vue.createElementVNode(
                    "text",
                    { class: "option-text" },
                    vue.toDisplayString(option),
                    1
                    /* TEXT */
                  )
                ], 10, ["onClick"]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]),
          $setup.showResult ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "action-buttons"
          }, [
            vue.createElementVNode("view", {
              class: "action-btn",
              onClick: $setup.goToWordDetail
            }, "详情"),
            vue.createElementVNode(
              "view",
              {
                class: "action-btn",
                onClick: $setup.nextQuestion
              },
              vue.toDisplayString($setup.isLastQuestion ? "查看结果" : "下一题 →"),
              1
              /* TEXT */
            )
          ])) : vue.createCommentVNode("v-if", true)
        ])) : vue.createCommentVNode("v-if", true),
        $setup.settings.mode === "fill" ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 2,
          class: "fill-mode"
        }, [
          $setup.currentWord.__isOldReview ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "review-word-flag"
          }, "复习巩固")) : vue.createCommentVNode("v-if", true),
          vue.createElementVNode("view", { class: "fill-sentence" }, [
            vue.createElementVNode("rich-text", {
              nodes: $setup.formatHighlight($setup.currentSentence)
            }, null, 8, ["nodes"])
          ]),
          vue.createElementVNode("view", { class: "options-grid" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.fillOptions, (option, idx) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: idx,
                  class: vue.normalizeClass(["option-card", {
                    "correct": $setup.showResult && option === $setup.fillAnswer,
                    "wrong": $setup.showResult && option === $setup.selectedOption && option !== $setup.fillAnswer
                  }]),
                  onClick: ($event) => !$setup.showResult && $setup.handleFillChoice(option)
                }, [
                  vue.createElementVNode(
                    "text",
                    { class: "option-text" },
                    vue.toDisplayString(option),
                    1
                    /* TEXT */
                  )
                ], 10, ["onClick"]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]),
          $setup.showResult && $setup.currentFillSentenceChinese ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "fill-result"
          }, [
            vue.createElementVNode("view", { class: "sentence-chinese" }, [
              vue.createTextVNode("句子释义："),
              vue.createElementVNode("rich-text", {
                nodes: $setup.formatHighlight($setup.currentFillSentenceChinese)
              }, null, 8, ["nodes"])
            ])
          ])) : vue.createCommentVNode("v-if", true),
          $setup.showResult ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 2,
            class: "action-buttons"
          }, [
            vue.createElementVNode("view", {
              class: "action-btn",
              onClick: $setup.goToWordDetail
            }, "详情"),
            vue.createElementVNode(
              "view",
              {
                class: "action-btn",
                onClick: $setup.nextQuestion
              },
              vue.toDisplayString($setup.isLastQuestion ? "查看结果" : "下一题 →"),
              1
              /* TEXT */
            )
          ])) : vue.createCommentVNode("v-if", true)
        ])) : vue.createCommentVNode("v-if", true),
        $setup.settings.mode === "spell" ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 3,
          class: "spell-mode"
        }, [
          $setup.currentWord.__isOldReview ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "review-word-flag"
          }, "复习巩固")) : vue.createCommentVNode("v-if", true),
          vue.createElementVNode("view", { class: "spell-prompt" }, "根据中文释义写出英文单词"),
          vue.createElementVNode(
            "view",
            { class: "spell-chinese" },
            vue.toDisplayString($setup.currentWord.chinese),
            1
            /* TEXT */
          ),
          vue.createElementVNode("view", { class: "input-area" }, [
            vue.withDirectives(vue.createElementVNode("input", {
              type: "text",
              "onUpdate:modelValue": _cache[23] || (_cache[23] = ($event) => $setup.spellInput = $event),
              class: "spell-input",
              placeholder: "输入英文单词",
              disabled: $setup.showResult,
              onConfirm: $setup.handleSpellSubmit
            }, null, 40, ["disabled"]), [
              [vue.vModelText, $setup.spellInput]
            ])
          ]),
          !$setup.showResult ? (vue.openBlock(), vue.createElementBlock("button", {
            key: 1,
            onClick: $setup.handleSpellSubmit,
            class: "btn-next",
            disabled: !($setup.spellInput || "").trim()
          }, " 提交 ", 8, ["disabled"])) : vue.createCommentVNode("v-if", true),
          $setup.showResult ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 2,
            class: "action-buttons"
          }, [
            vue.createElementVNode("view", {
              class: "action-btn",
              onClick: $setup.goToWordDetail
            }, "详情"),
            vue.createElementVNode(
              "view",
              {
                class: "action-btn",
                onClick: $setup.nextQuestion
              },
              vue.toDisplayString($setup.isLastQuestion ? "查看结果" : "下一题 →"),
              1
              /* TEXT */
            )
          ])) : vue.createCommentVNode("v-if", true)
        ])) : vue.createCommentVNode("v-if", true),
        $setup.settings.mode === "ai" ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 4,
          class: "ai-mode"
        }, [
          $setup.currentWord.__isOldReview ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "review-word-flag"
          }, "复习巩固")) : vue.createCommentVNode("v-if", true),
          vue.createElementVNode(
            "view",
            { class: "ai-word" },
            vue.toDisplayString($setup.currentWord.english),
            1
            /* TEXT */
          ),
          vue.createElementVNode("view", { class: "context-card" }, [
            vue.createElementVNode("view", { class: "context-sentence" }, [
              vue.createElementVNode("rich-text", {
                nodes: $setup.formatAIPhighlight($setup.aiSentence)
              }, null, 8, ["nodes"])
            ]),
            $setup.isGenerating ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "generating-indicator"
            }, [
              vue.createElementVNode("text", null, "AI 生成例句中...")
            ])) : vue.createCommentVNode("v-if", true)
          ]),
          vue.createElementVNode("view", { class: "input-area" }, [
            vue.withDirectives(vue.createElementVNode("input", {
              type: "text",
              "onUpdate:modelValue": _cache[24] || (_cache[24] = ($event) => $setup.userTranslation = $event),
              class: "translation-input",
              placeholder: $setup.isGenerating ? "等待例句生成..." : "输入该单词在此句中的意思...",
              disabled: $setup.isGenerating || $setup.showResult,
              onConfirm: $setup.submitAnswer
            }, null, 40, ["placeholder", "disabled"]), [
              [vue.vModelText, $setup.userTranslation]
            ])
          ]),
          $setup.showResult ? (vue.openBlock(), vue.createElementBlock(
            "view",
            {
              key: 1,
              class: vue.normalizeClass(["result-card", ((_a = $setup.aiResult) == null ? void 0 : _a.is_correct) ? "result-correct" : "result-wrong"])
            },
            [
              vue.createElementVNode("view", { class: "result-header" }, [
                vue.createElementVNode(
                  "text",
                  { class: "result-tag" },
                  vue.toDisplayString(((_b = $setup.aiResult) == null ? void 0 : _b.is_correct) ? "✅ 回答正确" : "❌ 需要纠正"),
                  1
                  /* TEXT */
                )
              ]),
              ((_c = $setup.aiResult) == null ? void 0 : _c.sentence_chinese) ? (vue.openBlock(), vue.createElementBlock(
                "view",
                {
                  key: 0,
                  class: "sentence-chinese"
                },
                "原句翻译：" + vue.toDisplayString($setup.aiResult.sentence_chinese),
                1
                /* TEXT */
              )) : vue.createCommentVNode("v-if", true),
              vue.createElementVNode("view", { class: "result-explanation" }, [
                vue.createElementVNode(
                  "text",
                  null,
                  vue.toDisplayString((_d = $setup.aiResult) == null ? void 0 : _d.explanation),
                  1
                  /* TEXT */
                )
              ])
            ],
            2
            /* CLASS */
          )) : vue.createCommentVNode("v-if", true),
          vue.createElementVNode("button", {
            onClick: _cache[25] || (_cache[25] = ($event) => $setup.showResult ? $setup.nextQuestion() : $setup.submitAnswer()),
            class: "btn-submit",
            disabled: $setup.isSubmitting || $setup.isGenerating
          }, vue.toDisplayString($setup.isSubmitting ? "AI 判卷中..." : $setup.showResult ? $setup.isLastQuestion ? "查看结果" : "下一题" : "提交答案"), 9, ["disabled"])
        ])) : vue.createCommentVNode("v-if", true)
      ])) : $setup.reviewStarted && $setup.reviewFinished ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 9,
        class: "finished"
      }, [
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass(["finished-icon", $setup.wrongCount === 0 ? "icon-perfect" : "icon-good"])
          },
          [
            vue.createElementVNode(
              "text",
              { class: "finished-icon-text" },
              vue.toDisplayString($setup.wrongCount === 0 ? "全对" : "加油"),
              1
              /* TEXT */
            )
          ],
          2
          /* CLASS */
        ),
        vue.createElementVNode("h3", null, "复习完成！"),
        vue.createElementVNode("view", { class: "finished-stats" }, [
          vue.createElementVNode(
            "text",
            null,
            "正确: " + vue.toDisplayString($setup.correctCount),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "text",
            null,
            "错误: " + vue.toDisplayString($setup.wrongCount),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "text",
            null,
            "正确率: " + vue.toDisplayString(Math.round($setup.correctCount / ($setup.correctCount + $setup.wrongCount || 1) * 100) || 0) + "%",
            1
            /* TEXT */
          )
        ]),
        $setup.finishedReviewInsight ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "finished-insight-card"
        }, [
          vue.createElementVNode("text", { class: "finished-insight-title" }, "算法调度结果"),
          vue.createElementVNode(
            "text",
            null,
            "平均掌握度 " + vue.toDisplayString($setup.finishedReviewInsight.avgMastery) + "%",
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "text",
            null,
            "已更新 " + vue.toDisplayString($setup.finishedReviewInsight.scheduledCount) + " 个词条",
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "text",
            null,
            "最近一次建议复习：" + vue.toDisplayString($setup.finishedReviewInsight.nextReviewText),
            1
            /* TEXT */
          )
        ])) : vue.createCommentVNode("v-if", true),
        $setup.wrongWords.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "wrong-words-section"
        }, [
          vue.createElementVNode(
            "view",
            { class: "wrong-title" },
            "本次错误单词 (" + vue.toDisplayString($setup.wrongWords.length) + ")",
            1
            /* TEXT */
          ),
          vue.createElementVNode("scroll-view", {
            "scroll-y": "",
            class: "wrong-list"
          }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.wrongWords, (item, idx) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: idx,
                  class: "wrong-item"
                }, [
                  vue.createElementVNode("view", { class: "wrong-word" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "eng" },
                      vue.toDisplayString(item.english),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "text",
                      { class: "chi" },
                      vue.toDisplayString(item.correctAnswer ? item.correctAnswer : item.chinese),
                      1
                      /* TEXT */
                    )
                  ]),
                  item.yourAnswer && item.yourAnswer !== item.correctAnswer && item.yourAnswer !== item.chinese ? (vue.openBlock(), vue.createElementBlock(
                    "view",
                    {
                      key: 0,
                      class: "your-answer"
                    },
                    " 你的答案: " + vue.toDisplayString(item.yourAnswer),
                    1
                    /* TEXT */
                  )) : vue.createCommentVNode("v-if", true),
                  item.synonyms && item.synonyms.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                    key: 1,
                    class: "wrong-synonyms"
                  }, [
                    (vue.openBlock(true), vue.createElementBlock(
                      vue.Fragment,
                      null,
                      vue.renderList(item.synonyms.slice(0, 3), (syn, sidx) => {
                        return vue.openBlock(), vue.createElementBlock(
                          "text",
                          {
                            key: sidx,
                            class: "syn-tag"
                          },
                          vue.toDisplayString(syn.synonym) + " (" + vue.toDisplayString(syn.chinese) + ") ",
                          1
                          /* TEXT */
                        );
                      }),
                      128
                      /* KEYED_FRAGMENT */
                    ))
                  ])) : vue.createCommentVNode("v-if", true)
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])
        ])) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode("view", { class: "finished-buttons" }, [
          $setup.wrongWords.length > 0 ? (vue.openBlock(), vue.createElementBlock("button", {
            key: 0,
            onClick: _cache[26] || (_cache[26] = ($event) => {
              $setup.reviewPreset = "wrong";
              $setup.restartReview();
            }),
            class: "btn-secondary"
          }, "错词再练")) : vue.createCommentVNode("v-if", true),
          vue.createElementVNode("button", {
            onClick: $setup.restartReview,
            class: "btn-primary"
          }, "再来一轮"),
          vue.createElementVNode("button", {
            onClick: $setup.goBack,
            class: "btn-secondary"
          }, "返回")
        ])
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesReviewReview = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["render", _sfc_render$9], ["__scopeId", "data-v-7018a65d"], ["__file", "E:/vocal/wordbook_new/pages/review/review.vue"]]);
  function buildShortChineseFromDefs(defs) {
    if (!Array.isArray(defs))
      return "";
    const parts = [];
    for (const d2 of defs) {
      if (!d2 || typeof d2 !== "object")
        continue;
      const pos = String(d2.pos || "").trim();
      const trans = String(d2.trans || "").trim();
      if (!trans)
        continue;
      parts.push(pos ? `${pos} ${trans}` : trans);
      if (parts.length >= 4)
        break;
    }
    return parts.join("；");
  }
  function splitTags(tags) {
    if (!tags)
      return [];
    return String(tags).split(/[,，\s]+/).map((t2) => t2.trim()).filter(Boolean);
  }
  async function getLocalWordSnapshot(english, options = {}) {
    var _a, _b, _c;
    const key = String(english || "").trim().toLowerCase();
    if (!key) {
      return {
        chinese: "",
        examples: [],
        synonyms: [],
        antonyms: [],
        tags: "",
        importance: void 0,
        examCount: 0
      };
    }
    const briefMap = options.briefMap && typeof options.briefMap === "object" ? options.briefMap : {};
    const brief = briefMap[key] && typeof briefMap[key] === "object" ? briefMap[key] : null;
    const [detail, pregen] = await Promise.all([
      getWordFullDetail(key).catch(() => null),
      getPregenWord(key).catch(() => null)
    ]);
    (detail == null ? void 0 : detail.examStats) || null;
    const chinese = ((brief == null ? void 0 : brief.chinese) || "").trim() || ((detail == null ? void 0 : detail.chinese) || "").trim() || buildShortChineseFromDefs(detail == null ? void 0 : detail.defs) || ((pregen == null ? void 0 : pregen.chinese) || "").trim() || "";
    const examples = Array.isArray(detail == null ? void 0 : detail.examples) && detail.examples.length ? detail.examples : Array.isArray(pregen == null ? void 0 : pregen.examples) ? pregen.examples : [];
    const synonyms = Array.isArray(detail == null ? void 0 : detail.synonyms) && detail.synonyms.length ? detail.synonyms : Array.isArray(pregen == null ? void 0 : pregen.synonyms) ? pregen.synonyms : [];
    const antonyms = Array.isArray(detail == null ? void 0 : detail.antonyms) && detail.antonyms.length ? detail.antonyms : Array.isArray(pregen == null ? void 0 : pregen.antonyms) ? pregen.antonyms : [];
    const tagSet = /* @__PURE__ */ new Set([
      ...splitTags((brief == null ? void 0 : brief.tags) || ""),
      ...((_a = detail == null ? void 0 : detail.examStats) == null ? void 0 : _a.tags) && Array.isArray(detail.examStats.tags) ? detail.examStats.tags : []
    ]);
    let importance;
    if (typeof ((_b = detail == null ? void 0 : detail.examStats) == null ? void 0 : _b.importance) === "number") {
      importance = detail.examStats.importance;
    } else if (typeof (brief == null ? void 0 : brief.importance) === "number") {
      importance = brief.importance;
    } else if (typeof (brief == null ? void 0 : brief.examCount) === "number") {
      importance = brief.examCount > 0 ? 1 : 0;
    }
    return {
      chinese,
      examples,
      synonyms,
      antonyms,
      tags: Array.from(tagSet).join(","),
      importance,
      examCount: typeof (brief == null ? void 0 : brief.examCount) === "number" ? brief.examCount : typeof ((_c = detail == null ? void 0 : detail.examStats) == null ? void 0 : _c.total_count) === "number" ? detail.examStats.total_count : 0
    };
  }
  const _sfc_main$8 = {
    __name: "quick-add",
    setup(__props, { expose: __expose }) {
      var _a;
      __expose();
      const word = vue.ref({
        english: "",
        chinese: "",
        importance: 3,
        // 默认三星
        source_page: "",
        year: "",
        tags: ""
      });
      const foundWord = vue.ref(null);
      const isLoading = vue.ref(false);
      const isSaving = vue.ref(false);
      const goBack = () => uni.navigateBack();
      const cloudWordbooks = vue.ref(getCloudWordbooks());
      const addToWordbook = vue.ref(((_a = cloudWordbooks.value[0]) == null ? void 0 : _a.id) || "self");
      const addToWordbookOptions = vue.computed(() => cloudWordbooks.value.map((o2) => o2.name));
      const addToWordbookIndex = vue.computed(() => {
        const i2 = cloudWordbooks.value.findIndex((o2) => o2.id === addToWordbook.value);
        return i2 >= 0 ? i2 : 0;
      });
      const addToWordbookLabel = vue.computed(() => {
        const w2 = cloudWordbooks.value.find((o2) => o2.id === addToWordbook.value);
        return w2 ? w2.name : "自用单词";
      });
      const onAddToWordbookChange = (e2) => {
        const i2 = Number(e2.detail.value) || 0;
        const w2 = cloudWordbooks.value[i2];
        addToWordbook.value = w2 ? w2.id : "self";
      };
      const applyLocalSnapshotToWord = (local) => {
        if (!local || typeof local !== "object")
          return;
        if (local.chinese && !word.value.chinese)
          word.value.chinese = local.chinese;
        if (local.tags)
          word.value.tags = local.tags;
        if (typeof local.importance === "number")
          word.value.importance = local.importance;
        word.value.examples = local.examples || [];
        word.value.synonyms = local.synonyms || [];
        word.value.antonyms = local.antonyms || [];
      };
      const normalizeWordHeavyFields = () => {
        word.value.examples = word.value.examples || [];
        word.value.synonyms = word.value.synonyms || [];
        word.value.antonyms = word.value.antonyms || [];
      };
      let _searchTimer = null;
      const searchWord = () => {
        if (_searchTimer)
          clearTimeout(_searchTimer);
        if (!word.value.english) {
          foundWord.value = null;
          return;
        }
        _searchTimer = setTimeout(async () => {
          _searchTimer = null;
          const english = word.value.english;
          if (!english)
            return;
          foundWord.value = null;
          const local = await getLocalWordSnapshot(english);
          if (word.value.english !== english)
            return;
          if (local && local.chinese) {
            foundWord.value = { word: english.trim(), chinese: local.chinese };
            word.value.chinese = local.chinese;
          } else {
            word.value.chinese = "";
          }
        }, 400);
      };
      const saveQuick = async () => {
        if (isSaving.value) {
          return;
        }
        if (!word.value.english || !word.value.chinese) {
          uni.showToast({
            title: "请输入英文单词",
            duration: 2e3
          });
          return;
        }
        try {
          const targetId = addToWordbook.value || "self";
          if (targetId !== "self") {
            const list = getWordbookWords(targetId) || [];
            const existing = list.find((w2) => (w2.english || "").toLowerCase() === word.value.english.toLowerCase());
            if (existing) {
              uni.showToast({ title: "该单词本中已存在该词", icon: "none" });
              return;
            }
            const local2 = await getLocalWordSnapshot(word.value.english);
            applyLocalSnapshotToWord(local2);
            isSaving.value = true;
            normalizeWordHeavyFields();
            const newWord = {
              id: String(Date.now()),
              ...word.value,
              create_time: (/* @__PURE__ */ new Date()).toISOString(),
              update_time: (/* @__PURE__ */ new Date()).toISOString(),
              view_count: 0
            };
            list.push(newWord);
            setWordbookWords(targetId, list);
            noteNewWordLearned(newWord, { bookId: targetId, source: "quick-add" });
            uni.showToast({ title: "已加入首日巩固", icon: "none", duration: 1800 });
            uni.$emit("refreshWordList");
            uni.navigateTo({ url: "/pages/index/index" });
            return;
          }
          const existingList = await db.getWordsForList(1, 0, "create_time", "desc", { search: word.value.english.trim() });
          const existingWord = existingList.find(
            (w2) => (w2.english || "").toLowerCase() === word.value.english.toLowerCase()
          );
          if (existingWord) {
            const newRepeat = (existingWord.repeat_count || 0) + 1;
            await db.updateWord(existingWord.id, {
              repeat_count: newRepeat,
              update_time: (/* @__PURE__ */ new Date()).toISOString()
            });
            uni.showToast({
              title: `该单词已存在，重复次数已增加到 ${newRepeat} 次`,
              duration: 2e3
            });
            uni.navigateTo({ url: `/pages/word-detail/word-detail?id=${existingWord.id}` });
            return;
          }
          const local = await getLocalWordSnapshot(word.value.english);
          applyLocalSnapshotToWord(local);
          isSaving.value = true;
          normalizeWordHeavyFields();
          const payload = { ...word.value };
          const added = await db.addWord(payload);
          const addedId = added == null ? void 0 : added.id;
          noteNewWordLearned({ ...payload, id: addedId }, { bookId: "self", source: "quick-add" });
          uni.showToast({ title: "已加入首日巩固", icon: "none", duration: 1800 });
          uni.navigateTo({ url: "/pages/index/index" });
          const english = word.value.english;
          (async () => {
            var _a2, _b, _c, _d, _e2, _f, _g, _h;
            try {
              const pregen = await getPregenWord(english);
              if (pregen && (((_a2 = pregen.examples) == null ? void 0 : _a2.length) || ((_b = pregen.synonyms) == null ? void 0 : _b.length) || ((_c = pregen.antonyms) == null ? void 0 : _c.length))) {
                const updates2 = { update_time: (/* @__PURE__ */ new Date()).toISOString() };
                if ((_d = pregen.examples) == null ? void 0 : _d.length)
                  updates2.examples = pregen.examples;
                if ((_e2 = pregen.synonyms) == null ? void 0 : _e2.length)
                  updates2.synonyms = pregen.synonyms;
                if ((_f = pregen.antonyms) == null ? void 0 : _f.length)
                  updates2.antonyms = pregen.antonyms;
                if (Object.keys(updates2).length > 1) {
                  await db.updateWord(addedId, updates2);
                  uni.$emit("wordEnriched", addedId);
                }
                return;
              }
              const recentWords = await db.getWordsForList(10, 0, "create_time", "desc", {});
              const existingWords = recentWords.filter((w2) => w2.english && w2.english.toLowerCase() !== english.toLowerCase()).map((w2) => w2.english).slice(0, 10);
              let examStatsText = "";
              try {
                const examData = await getWordExamData(english);
                if (examData == null ? void 0 : examData.examStats)
                  examStatsText = formatWordStatsForPrompt(examData.examStats);
              } catch (_2) {
              }
              const [result, antonyms] = await Promise.all([
                aiService.generateExamplesAndSynonyms(english, existingWords, examStatsText),
                aiService.generateAntonyms(english, 3)
              ]);
              const updates = { update_time: (/* @__PURE__ */ new Date()).toISOString() };
              if ((_g = result == null ? void 0 : result.examples) == null ? void 0 : _g.length)
                updates.examples = result.examples;
              if ((_h = result == null ? void 0 : result.synonyms) == null ? void 0 : _h.length)
                updates.synonyms = result.synonyms;
              if (antonyms == null ? void 0 : antonyms.length)
                updates.antonyms = antonyms;
              if (Object.keys(updates).length > 1) {
                await db.updateWord(addedId, updates);
                uni.$emit("wordEnriched", addedId);
              }
            } catch (_2) {
            }
          })();
        } catch (error) {
          formatAppLog("error", "at pages/quick-add/quick-add.vue:268", "保存失败:", error);
          uni.showToast({ title: "保存失败，请重试", icon: "none", duration: 2e3 });
        } finally {
          isSaving.value = false;
        }
      };
      const saveAndEdit = async () => {
        if (isSaving.value)
          return;
        if (!word.value.english || !word.value.chinese) {
          uni.showToast({ title: "请输入英文单词", duration: 2e3 });
          return;
        }
        try {
          const targetId = addToWordbook.value || "self";
          if (targetId !== "self") {
            const list = getWordbookWords(targetId) || [];
            const existing = list.find((w2) => (w2.english || "").toLowerCase() === word.value.english.toLowerCase());
            if (existing) {
              uni.showToast({ title: "该单词本中已存在该词", icon: "none" });
              return;
            }
            const local2 = await getLocalWordSnapshot(word.value.english);
            applyLocalSnapshotToWord(local2);
            isSaving.value = true;
            normalizeWordHeavyFields();
            const newWord = {
              id: String(Date.now()),
              ...word.value,
              create_time: (/* @__PURE__ */ new Date()).toISOString(),
              update_time: (/* @__PURE__ */ new Date()).toISOString(),
              view_count: 0
            };
            list.push(newWord);
            setWordbookWords(targetId, list);
            noteNewWordLearned(newWord, { bookId: targetId, source: "quick-add" });
            uni.showToast({ title: "已加入首日巩固", icon: "none", duration: 1800 });
            uni.$emit("refreshWordList");
            uni.navigateTo({ url: "/pages/index/index" });
            return;
          }
          const existingList2 = await db.getWordsForList(1, 0, "create_time", "desc", { search: word.value.english.trim() });
          const existingWord = existingList2.find(
            (w2) => (w2.english || "").toLowerCase() === word.value.english.toLowerCase()
          );
          if (existingWord) {
            const newRepeat = (existingWord.repeat_count || 0) + 1;
            await db.updateWord(existingWord.id, {
              repeat_count: newRepeat,
              update_time: (/* @__PURE__ */ new Date()).toISOString()
            });
            uni.showToast({
              title: `该单词已存在，重复次数已增加到 ${newRepeat} 次`,
              duration: 1e3
            });
            uni.navigateTo({ url: `/pages/word-detail/word-detail?id=${existingWord.id}` });
            return;
          }
          const local = await getLocalWordSnapshot(word.value.english);
          applyLocalSnapshotToWord(local);
          isSaving.value = true;
          normalizeWordHeavyFields();
          const payload = { ...word.value };
          const added = await db.addWord(payload);
          const addedId = added == null ? void 0 : added.id;
          noteNewWordLearned({ ...payload, id: addedId }, { bookId: "self", source: "quick-add" });
          uni.showToast({ title: "已加入首日巩固", icon: "none", duration: 1800 });
          uni.navigateTo({ url: `/pages/word-detail/word-detail?id=${addedId}` });
          const english = word.value.english;
          (async () => {
            var _a2, _b, _c, _d, _e2, _f, _g, _h;
            try {
              const pregen = await getPregenWord(english);
              if (pregen && (((_a2 = pregen.examples) == null ? void 0 : _a2.length) || ((_b = pregen.synonyms) == null ? void 0 : _b.length) || ((_c = pregen.antonyms) == null ? void 0 : _c.length))) {
                const updates2 = { update_time: (/* @__PURE__ */ new Date()).toISOString() };
                if ((_d = pregen.examples) == null ? void 0 : _d.length)
                  updates2.examples = pregen.examples;
                if ((_e2 = pregen.synonyms) == null ? void 0 : _e2.length)
                  updates2.synonyms = pregen.synonyms;
                if ((_f = pregen.antonyms) == null ? void 0 : _f.length)
                  updates2.antonyms = pregen.antonyms;
                if (Object.keys(updates2).length > 1) {
                  await db.updateWord(addedId, updates2);
                  uni.$emit("wordEnriched", addedId);
                }
                return;
              }
              const recentWords2 = await db.getWordsForList(10, 0, "create_time", "desc", {});
              const existingWords = recentWords2.filter((w2) => w2.english && w2.english.toLowerCase() !== english.toLowerCase()).map((w2) => w2.english).slice(0, 10);
              let examStatsText = "";
              try {
                const examData = await getWordExamData(english);
                if (examData == null ? void 0 : examData.examStats)
                  examStatsText = formatWordStatsForPrompt(examData.examStats);
              } catch (_2) {
              }
              const [result, antonyms] = await Promise.all([
                aiService.generateExamplesAndSynonyms(english, existingWords, examStatsText),
                aiService.generateAntonyms(english, 3)
              ]);
              const updates = { update_time: (/* @__PURE__ */ new Date()).toISOString() };
              if ((_g = result == null ? void 0 : result.examples) == null ? void 0 : _g.length)
                updates.examples = result.examples;
              if ((_h = result == null ? void 0 : result.synonyms) == null ? void 0 : _h.length)
                updates.synonyms = result.synonyms;
              if (antonyms == null ? void 0 : antonyms.length)
                updates.antonyms = antonyms;
              if (Object.keys(updates).length > 1) {
                await db.updateWord(addedId, updates);
                uni.$emit("wordEnriched", addedId);
              }
            } catch (_2) {
            }
          })();
        } catch (error) {
          formatAppLog("error", "at pages/quick-add/quick-add.vue:384", "保存失败:", error);
          uni.showToast({ title: "保存失败，请重试", icon: "none", duration: 2e3 });
        } finally {
          isSaving.value = false;
        }
      };
      vue.onMounted(async () => {
        cloudWordbooks.value = getCloudWordbooks();
        const lastWord = await db.getLastWord();
        if (lastWord) {
          word.value.source_page = lastWord.source_page || "";
          word.value.year = lastWord.year || "";
        }
      });
      onShow(() => {
        cloudWordbooks.value = getCloudWordbooks();
      });
      onUnload(() => {
        try {
          cleanupExpiredCaches();
        } catch (error) {
          logger.warn("QuickAdd", "清理缓存失败", error);
        }
      });
      const __returned__ = { word, foundWord, isLoading, isSaving, goBack, cloudWordbooks, addToWordbook, addToWordbookOptions, addToWordbookIndex, addToWordbookLabel, onAddToWordbookChange, applyLocalSnapshotToWord, normalizeWordHeavyFields, get _searchTimer() {
        return _searchTimer;
      }, set _searchTimer(v2) {
        _searchTimer = v2;
      }, searchWord, saveQuick, saveAndEdit, ref: vue.ref, computed: vue.computed, onMounted: vue.onMounted, VocalColorBlockSelector, get onShow() {
        return onShow;
      }, get onUnload() {
        return onUnload;
      }, get db() {
        return db;
      }, get aiService() {
        return aiService;
      }, get formatWordStatsForPrompt() {
        return formatWordStatsForPrompt;
      }, get pregenVocab() {
        return pregenVocab;
      }, get masterDb() {
        return masterDb;
      }, get getLocalWordSnapshot() {
        return getLocalWordSnapshot;
      }, get getCloudWordbooks() {
        return getCloudWordbooks;
      }, get getWordbookWords() {
        return getWordbookWords;
      }, get setWordbookWords() {
        return setWordbookWords;
      }, get noteNewWordLearned() {
        return noteNewWordLearned;
      }, get logger() {
        return logger;
      }, get errorHandler() {
        return errorHandler;
      }, get cleanupExpiredCaches() {
        return cleanupExpiredCaches;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "custom-nav-bar" }, [
        vue.createElementVNode("view", {
          class: "nav-back-btn",
          onClick: $setup.goBack
        }, "‹")
      ]),
      vue.createElementVNode("view", { class: "main-content" }, [
        vue.createElementVNode("view", { class: "qa-english-wrap" }, [
          vue.withDirectives(vue.createElementVNode("input", {
            type: "text",
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.word.english = $event),
            onInput: $setup.searchWord,
            placeholder: "请输入英文单词...",
            disabled: $setup.isSaving,
            class: "qa-english-input"
          }, null, 40, ["disabled"]), [
            [vue.vModelText, $setup.word.english]
          ])
        ]),
        vue.createElementVNode("view", { class: "qa-meta-row" }, [
          vue.createElementVNode("view", { class: "qa-meta-item" }, [
            vue.createElementVNode("text", { class: "qa-meta-label" }, "P."),
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                type: "number",
                "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $setup.word.source_page = $event),
                placeholder: "页码",
                class: "qa-meta-input"
              },
              null,
              512
              /* NEED_PATCH */
            ), [
              [vue.vModelText, $setup.word.source_page]
            ])
          ]),
          vue.createElementVNode("view", { class: "qa-meta-item" }, [
            vue.createElementVNode("text", { class: "qa-meta-label" }, "Year"),
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                type: "number",
                "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $setup.word.year = $event),
                placeholder: "年份",
                class: "qa-meta-input"
              },
              null,
              512
              /* NEED_PATCH */
            ), [
              [vue.vModelText, $setup.word.year]
            ])
          ])
        ]),
        vue.createElementVNode("view", { class: "add-to-wordbook-row" }, [
          vue.createElementVNode("text", { class: "add-to-label" }, "添加到单词本"),
          vue.createVNode($setup["VocalColorBlockSelector"], {
            range: $setup.addToWordbookOptions,
            value: $setup.addToWordbookIndex,
            onChange: $setup.onAddToWordbookChange
          }, {
            default: vue.withCtx(() => [
              vue.createElementVNode(
                "view",
                { class: "add-to-picker" },
                vue.toDisplayString($setup.addToWordbookLabel),
                1
                /* TEXT */
              )
            ]),
            _: 1
            /* STABLE */
          }, 8, ["range", "value"])
        ]),
        $setup.foundWord ? (vue.openBlock(), vue.createElementBlock("div", {
          key: 0,
          style: { "background-color": "#f5f7fa", "padding": "15px", "border-radius": "12px", "margin-top": "20px" }
        }, [
          vue.createElementVNode("div", { style: { "font-size": "14px", "line-height": "1.5" } }, [
            vue.createElementVNode("span", { style: { "font-weight": "bold", "color": "#4A4E69", "margin-right": "8px" } }, "中文释义："),
            vue.createElementVNode(
              "span",
              null,
              vue.toDisplayString($setup.foundWord.chinese),
              1
              /* TEXT */
            )
          ])
        ])) : vue.createCommentVNode("v-if", true)
      ]),
      vue.createElementVNode("view", { class: "footer" }, [
        vue.createElementVNode("button", {
          onClick: $setup.goBack,
          disabled: $setup.isSaving
        }, "取消", 8, ["disabled"]),
        vue.createElementVNode("button", {
          onClick: $setup.saveQuick,
          disabled: $setup.isSaving
        }, "快速保存", 8, ["disabled"]),
        vue.createElementVNode("button", {
          onClick: $setup.saveAndEdit,
          disabled: $setup.isSaving
        }, "保存并编辑", 8, ["disabled"])
      ])
    ]);
  }
  const PagesQuickAddQuickAdd = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$8], ["__scopeId", "data-v-59bf85e1"], ["__file", "E:/vocal/wordbook_new/pages/quick-add/quick-add.vue"]]);
  const pages = [
    {
      path: "pages/index/index",
      style: {
        navigationStyle: "custom",
        animationType: "slide-in-right",
        animationDuration: 300
      }
    },
    {
      path: "pages/word-detail/word-detail",
      style: {
        navigationStyle: "custom",
        animationType: "slide-in-right",
        animationDuration: 300
      }
    },
    {
      path: "pages/review/review",
      style: {
        navigationStyle: "custom",
        animationType: "slide-in-right",
        animationDuration: 300
      }
    },
    {
      path: "pages/quick-add/quick-add",
      style: {
        navigationStyle: "custom",
        animationType: "slide-in-right",
        animationDuration: 300
      }
    },
    {
      path: "pages/login/login",
      style: {
        navigationStyle: "custom",
        animationType: "slide-in-right",
        animationDuration: 300
      }
    },
    {
      path: "pages/my/my",
      style: {
        navigationStyle: "custom",
        animationType: "slide-in-right",
        animationDuration: 300
      }
    },
    {
      path: "pages/my/edit-nickname",
      style: {
        navigationStyle: "custom",
        animationType: "slide-in-right",
        animationDuration: 300
      }
    },
    {
      path: "pages/wordbook-list/wordbook-list",
      style: {
        navigationStyle: "custom",
        animationType: "slide-in-right",
        animationDuration: 300
      }
    },
    {
      path: "pages/stats/stats",
      style: {
        navigationStyle: "custom",
        animationType: "slide-in-right",
        animationDuration: 300
      }
    },
    {
      path: "pages/mistakes/mistakes",
      style: {
        navigationStyle: "custom",
        animationType: "slide-in-right",
        animationDuration: 300
      }
    },
    {
      path: "pages/mastered-words/mastered-words",
      style: {
        navigationStyle: "custom",
        animationType: "slide-in-right",
        animationDuration: 300
      }
    }
  ];
  const globalStyle = {
    navigationStyle: "custom",
    backgroundColor: "#FFF0F3"
  };
  const condition = {
    current: 0,
    list: [
      {
        name: "",
        path: "",
        query: ""
      }
    ]
  };
  const e = {
    pages,
    globalStyle,
    condition
  };
  var define_process_env_UNI_SECURE_NETWORK_CONFIG_default = [];
  function t(e2) {
    return e2 && e2.__esModule && Object.prototype.hasOwnProperty.call(e2, "default") ? e2.default : e2;
  }
  function n(e2, t2, n2) {
    return e2(n2 = { path: t2, exports: {}, require: function(e3, t3) {
      return function() {
        throw new Error("Dynamic requires are not currently supported by @rollup/plugin-commonjs");
      }(null == t3 && n2.path);
    } }, n2.exports), n2.exports;
  }
  var s = n(function(e2, t2) {
    var n2;
    e2.exports = (n2 = n2 || function(e3, t3) {
      var n3 = Object.create || /* @__PURE__ */ function() {
        function e4() {
        }
        return function(t4) {
          var n4;
          return e4.prototype = t4, n4 = new e4(), e4.prototype = null, n4;
        };
      }(), s2 = {}, r2 = s2.lib = {}, i2 = r2.Base = { extend: function(e4) {
        var t4 = n3(this);
        return e4 && t4.mixIn(e4), t4.hasOwnProperty("init") && this.init !== t4.init || (t4.init = function() {
          t4.$super.init.apply(this, arguments);
        }), t4.init.prototype = t4, t4.$super = this, t4;
      }, create: function() {
        var e4 = this.extend();
        return e4.init.apply(e4, arguments), e4;
      }, init: function() {
      }, mixIn: function(e4) {
        for (var t4 in e4)
          e4.hasOwnProperty(t4) && (this[t4] = e4[t4]);
        e4.hasOwnProperty("toString") && (this.toString = e4.toString);
      }, clone: function() {
        return this.init.prototype.extend(this);
      } }, o2 = r2.WordArray = i2.extend({ init: function(e4, n4) {
        e4 = this.words = e4 || [], this.sigBytes = n4 != t3 ? n4 : 4 * e4.length;
      }, toString: function(e4) {
        return (e4 || c2).stringify(this);
      }, concat: function(e4) {
        var t4 = this.words, n4 = e4.words, s3 = this.sigBytes, r3 = e4.sigBytes;
        if (this.clamp(), s3 % 4)
          for (var i3 = 0; i3 < r3; i3++) {
            var o3 = n4[i3 >>> 2] >>> 24 - i3 % 4 * 8 & 255;
            t4[s3 + i3 >>> 2] |= o3 << 24 - (s3 + i3) % 4 * 8;
          }
        else
          for (i3 = 0; i3 < r3; i3 += 4)
            t4[s3 + i3 >>> 2] = n4[i3 >>> 2];
        return this.sigBytes += r3, this;
      }, clamp: function() {
        var t4 = this.words, n4 = this.sigBytes;
        t4[n4 >>> 2] &= 4294967295 << 32 - n4 % 4 * 8, t4.length = e3.ceil(n4 / 4);
      }, clone: function() {
        var e4 = i2.clone.call(this);
        return e4.words = this.words.slice(0), e4;
      }, random: function(t4) {
        for (var n4, s3 = [], r3 = function(t5) {
          var n5 = 987654321, s4 = 4294967295;
          return function() {
            var r4 = ((n5 = 36969 * (65535 & n5) + (n5 >> 16) & s4) << 16) + (t5 = 18e3 * (65535 & t5) + (t5 >> 16) & s4) & s4;
            return r4 /= 4294967296, (r4 += 0.5) * (e3.random() > 0.5 ? 1 : -1);
          };
        }, i3 = 0; i3 < t4; i3 += 4) {
          var a3 = r3(4294967296 * (n4 || e3.random()));
          n4 = 987654071 * a3(), s3.push(4294967296 * a3() | 0);
        }
        return new o2.init(s3, t4);
      } }), a2 = s2.enc = {}, c2 = a2.Hex = { stringify: function(e4) {
        for (var t4 = e4.words, n4 = e4.sigBytes, s3 = [], r3 = 0; r3 < n4; r3++) {
          var i3 = t4[r3 >>> 2] >>> 24 - r3 % 4 * 8 & 255;
          s3.push((i3 >>> 4).toString(16)), s3.push((15 & i3).toString(16));
        }
        return s3.join("");
      }, parse: function(e4) {
        for (var t4 = e4.length, n4 = [], s3 = 0; s3 < t4; s3 += 2)
          n4[s3 >>> 3] |= parseInt(e4.substr(s3, 2), 16) << 24 - s3 % 8 * 4;
        return new o2.init(n4, t4 / 2);
      } }, u2 = a2.Latin1 = { stringify: function(e4) {
        for (var t4 = e4.words, n4 = e4.sigBytes, s3 = [], r3 = 0; r3 < n4; r3++) {
          var i3 = t4[r3 >>> 2] >>> 24 - r3 % 4 * 8 & 255;
          s3.push(String.fromCharCode(i3));
        }
        return s3.join("");
      }, parse: function(e4) {
        for (var t4 = e4.length, n4 = [], s3 = 0; s3 < t4; s3++)
          n4[s3 >>> 2] |= (255 & e4.charCodeAt(s3)) << 24 - s3 % 4 * 8;
        return new o2.init(n4, t4);
      } }, h2 = a2.Utf8 = { stringify: function(e4) {
        try {
          return decodeURIComponent(escape(u2.stringify(e4)));
        } catch (e5) {
          throw new Error("Malformed UTF-8 data");
        }
      }, parse: function(e4) {
        return u2.parse(unescape(encodeURIComponent(e4)));
      } }, l2 = r2.BufferedBlockAlgorithm = i2.extend({ reset: function() {
        this._data = new o2.init(), this._nDataBytes = 0;
      }, _append: function(e4) {
        "string" == typeof e4 && (e4 = h2.parse(e4)), this._data.concat(e4), this._nDataBytes += e4.sigBytes;
      }, _process: function(t4) {
        var n4 = this._data, s3 = n4.words, r3 = n4.sigBytes, i3 = this.blockSize, a3 = r3 / (4 * i3), c3 = (a3 = t4 ? e3.ceil(a3) : e3.max((0 | a3) - this._minBufferSize, 0)) * i3, u3 = e3.min(4 * c3, r3);
        if (c3) {
          for (var h3 = 0; h3 < c3; h3 += i3)
            this._doProcessBlock(s3, h3);
          var l3 = s3.splice(0, c3);
          n4.sigBytes -= u3;
        }
        return new o2.init(l3, u3);
      }, clone: function() {
        var e4 = i2.clone.call(this);
        return e4._data = this._data.clone(), e4;
      }, _minBufferSize: 0 });
      r2.Hasher = l2.extend({ cfg: i2.extend(), init: function(e4) {
        this.cfg = this.cfg.extend(e4), this.reset();
      }, reset: function() {
        l2.reset.call(this), this._doReset();
      }, update: function(e4) {
        return this._append(e4), this._process(), this;
      }, finalize: function(e4) {
        return e4 && this._append(e4), this._doFinalize();
      }, blockSize: 16, _createHelper: function(e4) {
        return function(t4, n4) {
          return new e4.init(n4).finalize(t4);
        };
      }, _createHmacHelper: function(e4) {
        return function(t4, n4) {
          return new d2.HMAC.init(e4, n4).finalize(t4);
        };
      } });
      var d2 = s2.algo = {};
      return s2;
    }(Math), n2);
  }), r = s, i = (n(function(e2, t2) {
    var n2;
    e2.exports = (n2 = r, function(e3) {
      var t3 = n2, s2 = t3.lib, r2 = s2.WordArray, i2 = s2.Hasher, o2 = t3.algo, a2 = [];
      !function() {
        for (var t4 = 0; t4 < 64; t4++)
          a2[t4] = 4294967296 * e3.abs(e3.sin(t4 + 1)) | 0;
      }();
      var c2 = o2.MD5 = i2.extend({ _doReset: function() {
        this._hash = new r2.init([1732584193, 4023233417, 2562383102, 271733878]);
      }, _doProcessBlock: function(e4, t4) {
        for (var n3 = 0; n3 < 16; n3++) {
          var s3 = t4 + n3, r3 = e4[s3];
          e4[s3] = 16711935 & (r3 << 8 | r3 >>> 24) | 4278255360 & (r3 << 24 | r3 >>> 8);
        }
        var i3 = this._hash.words, o3 = e4[t4 + 0], c3 = e4[t4 + 1], p2 = e4[t4 + 2], f2 = e4[t4 + 3], g2 = e4[t4 + 4], m2 = e4[t4 + 5], y2 = e4[t4 + 6], _2 = e4[t4 + 7], w2 = e4[t4 + 8], I2 = e4[t4 + 9], v2 = e4[t4 + 10], S2 = e4[t4 + 11], T2 = e4[t4 + 12], b2 = e4[t4 + 13], E2 = e4[t4 + 14], k2 = e4[t4 + 15], A2 = i3[0], P2 = i3[1], C2 = i3[2], O2 = i3[3];
        A2 = u2(A2, P2, C2, O2, o3, 7, a2[0]), O2 = u2(O2, A2, P2, C2, c3, 12, a2[1]), C2 = u2(C2, O2, A2, P2, p2, 17, a2[2]), P2 = u2(P2, C2, O2, A2, f2, 22, a2[3]), A2 = u2(A2, P2, C2, O2, g2, 7, a2[4]), O2 = u2(O2, A2, P2, C2, m2, 12, a2[5]), C2 = u2(C2, O2, A2, P2, y2, 17, a2[6]), P2 = u2(P2, C2, O2, A2, _2, 22, a2[7]), A2 = u2(A2, P2, C2, O2, w2, 7, a2[8]), O2 = u2(O2, A2, P2, C2, I2, 12, a2[9]), C2 = u2(C2, O2, A2, P2, v2, 17, a2[10]), P2 = u2(P2, C2, O2, A2, S2, 22, a2[11]), A2 = u2(A2, P2, C2, O2, T2, 7, a2[12]), O2 = u2(O2, A2, P2, C2, b2, 12, a2[13]), C2 = u2(C2, O2, A2, P2, E2, 17, a2[14]), A2 = h2(A2, P2 = u2(P2, C2, O2, A2, k2, 22, a2[15]), C2, O2, c3, 5, a2[16]), O2 = h2(O2, A2, P2, C2, y2, 9, a2[17]), C2 = h2(C2, O2, A2, P2, S2, 14, a2[18]), P2 = h2(P2, C2, O2, A2, o3, 20, a2[19]), A2 = h2(A2, P2, C2, O2, m2, 5, a2[20]), O2 = h2(O2, A2, P2, C2, v2, 9, a2[21]), C2 = h2(C2, O2, A2, P2, k2, 14, a2[22]), P2 = h2(P2, C2, O2, A2, g2, 20, a2[23]), A2 = h2(A2, P2, C2, O2, I2, 5, a2[24]), O2 = h2(O2, A2, P2, C2, E2, 9, a2[25]), C2 = h2(C2, O2, A2, P2, f2, 14, a2[26]), P2 = h2(P2, C2, O2, A2, w2, 20, a2[27]), A2 = h2(A2, P2, C2, O2, b2, 5, a2[28]), O2 = h2(O2, A2, P2, C2, p2, 9, a2[29]), C2 = h2(C2, O2, A2, P2, _2, 14, a2[30]), A2 = l2(A2, P2 = h2(P2, C2, O2, A2, T2, 20, a2[31]), C2, O2, m2, 4, a2[32]), O2 = l2(O2, A2, P2, C2, w2, 11, a2[33]), C2 = l2(C2, O2, A2, P2, S2, 16, a2[34]), P2 = l2(P2, C2, O2, A2, E2, 23, a2[35]), A2 = l2(A2, P2, C2, O2, c3, 4, a2[36]), O2 = l2(O2, A2, P2, C2, g2, 11, a2[37]), C2 = l2(C2, O2, A2, P2, _2, 16, a2[38]), P2 = l2(P2, C2, O2, A2, v2, 23, a2[39]), A2 = l2(A2, P2, C2, O2, b2, 4, a2[40]), O2 = l2(O2, A2, P2, C2, o3, 11, a2[41]), C2 = l2(C2, O2, A2, P2, f2, 16, a2[42]), P2 = l2(P2, C2, O2, A2, y2, 23, a2[43]), A2 = l2(A2, P2, C2, O2, I2, 4, a2[44]), O2 = l2(O2, A2, P2, C2, T2, 11, a2[45]), C2 = l2(C2, O2, A2, P2, k2, 16, a2[46]), A2 = d2(A2, P2 = l2(P2, C2, O2, A2, p2, 23, a2[47]), C2, O2, o3, 6, a2[48]), O2 = d2(O2, A2, P2, C2, _2, 10, a2[49]), C2 = d2(C2, O2, A2, P2, E2, 15, a2[50]), P2 = d2(P2, C2, O2, A2, m2, 21, a2[51]), A2 = d2(A2, P2, C2, O2, T2, 6, a2[52]), O2 = d2(O2, A2, P2, C2, f2, 10, a2[53]), C2 = d2(C2, O2, A2, P2, v2, 15, a2[54]), P2 = d2(P2, C2, O2, A2, c3, 21, a2[55]), A2 = d2(A2, P2, C2, O2, w2, 6, a2[56]), O2 = d2(O2, A2, P2, C2, k2, 10, a2[57]), C2 = d2(C2, O2, A2, P2, y2, 15, a2[58]), P2 = d2(P2, C2, O2, A2, b2, 21, a2[59]), A2 = d2(A2, P2, C2, O2, g2, 6, a2[60]), O2 = d2(O2, A2, P2, C2, S2, 10, a2[61]), C2 = d2(C2, O2, A2, P2, p2, 15, a2[62]), P2 = d2(P2, C2, O2, A2, I2, 21, a2[63]), i3[0] = i3[0] + A2 | 0, i3[1] = i3[1] + P2 | 0, i3[2] = i3[2] + C2 | 0, i3[3] = i3[3] + O2 | 0;
      }, _doFinalize: function() {
        var t4 = this._data, n3 = t4.words, s3 = 8 * this._nDataBytes, r3 = 8 * t4.sigBytes;
        n3[r3 >>> 5] |= 128 << 24 - r3 % 32;
        var i3 = e3.floor(s3 / 4294967296), o3 = s3;
        n3[15 + (r3 + 64 >>> 9 << 4)] = 16711935 & (i3 << 8 | i3 >>> 24) | 4278255360 & (i3 << 24 | i3 >>> 8), n3[14 + (r3 + 64 >>> 9 << 4)] = 16711935 & (o3 << 8 | o3 >>> 24) | 4278255360 & (o3 << 24 | o3 >>> 8), t4.sigBytes = 4 * (n3.length + 1), this._process();
        for (var a3 = this._hash, c3 = a3.words, u3 = 0; u3 < 4; u3++) {
          var h3 = c3[u3];
          c3[u3] = 16711935 & (h3 << 8 | h3 >>> 24) | 4278255360 & (h3 << 24 | h3 >>> 8);
        }
        return a3;
      }, clone: function() {
        var e4 = i2.clone.call(this);
        return e4._hash = this._hash.clone(), e4;
      } });
      function u2(e4, t4, n3, s3, r3, i3, o3) {
        var a3 = e4 + (t4 & n3 | ~t4 & s3) + r3 + o3;
        return (a3 << i3 | a3 >>> 32 - i3) + t4;
      }
      function h2(e4, t4, n3, s3, r3, i3, o3) {
        var a3 = e4 + (t4 & s3 | n3 & ~s3) + r3 + o3;
        return (a3 << i3 | a3 >>> 32 - i3) + t4;
      }
      function l2(e4, t4, n3, s3, r3, i3, o3) {
        var a3 = e4 + (t4 ^ n3 ^ s3) + r3 + o3;
        return (a3 << i3 | a3 >>> 32 - i3) + t4;
      }
      function d2(e4, t4, n3, s3, r3, i3, o3) {
        var a3 = e4 + (n3 ^ (t4 | ~s3)) + r3 + o3;
        return (a3 << i3 | a3 >>> 32 - i3) + t4;
      }
      t3.MD5 = i2._createHelper(c2), t3.HmacMD5 = i2._createHmacHelper(c2);
    }(Math), n2.MD5);
  }), n(function(e2, t2) {
    var n2;
    e2.exports = (n2 = r, void function() {
      var e3 = n2, t3 = e3.lib.Base, s2 = e3.enc.Utf8;
      e3.algo.HMAC = t3.extend({ init: function(e4, t4) {
        e4 = this._hasher = new e4.init(), "string" == typeof t4 && (t4 = s2.parse(t4));
        var n3 = e4.blockSize, r2 = 4 * n3;
        t4.sigBytes > r2 && (t4 = e4.finalize(t4)), t4.clamp();
        for (var i2 = this._oKey = t4.clone(), o2 = this._iKey = t4.clone(), a2 = i2.words, c2 = o2.words, u2 = 0; u2 < n3; u2++)
          a2[u2] ^= 1549556828, c2[u2] ^= 909522486;
        i2.sigBytes = o2.sigBytes = r2, this.reset();
      }, reset: function() {
        var e4 = this._hasher;
        e4.reset(), e4.update(this._iKey);
      }, update: function(e4) {
        return this._hasher.update(e4), this;
      }, finalize: function(e4) {
        var t4 = this._hasher, n3 = t4.finalize(e4);
        return t4.reset(), t4.finalize(this._oKey.clone().concat(n3));
      } });
    }());
  }), n(function(e2, t2) {
    e2.exports = r.HmacMD5;
  })), o = n(function(e2, t2) {
    e2.exports = r.enc.Utf8;
  }), a = n(function(e2, t2) {
    var n2;
    e2.exports = (n2 = r, function() {
      var e3 = n2, t3 = e3.lib.WordArray;
      function s2(e4, n3, s3) {
        for (var r2 = [], i2 = 0, o2 = 0; o2 < n3; o2++)
          if (o2 % 4) {
            var a2 = s3[e4.charCodeAt(o2 - 1)] << o2 % 4 * 2, c2 = s3[e4.charCodeAt(o2)] >>> 6 - o2 % 4 * 2;
            r2[i2 >>> 2] |= (a2 | c2) << 24 - i2 % 4 * 8, i2++;
          }
        return t3.create(r2, i2);
      }
      e3.enc.Base64 = { stringify: function(e4) {
        var t4 = e4.words, n3 = e4.sigBytes, s3 = this._map;
        e4.clamp();
        for (var r2 = [], i2 = 0; i2 < n3; i2 += 3)
          for (var o2 = (t4[i2 >>> 2] >>> 24 - i2 % 4 * 8 & 255) << 16 | (t4[i2 + 1 >>> 2] >>> 24 - (i2 + 1) % 4 * 8 & 255) << 8 | t4[i2 + 2 >>> 2] >>> 24 - (i2 + 2) % 4 * 8 & 255, a2 = 0; a2 < 4 && i2 + 0.75 * a2 < n3; a2++)
            r2.push(s3.charAt(o2 >>> 6 * (3 - a2) & 63));
        var c2 = s3.charAt(64);
        if (c2)
          for (; r2.length % 4; )
            r2.push(c2);
        return r2.join("");
      }, parse: function(e4) {
        var t4 = e4.length, n3 = this._map, r2 = this._reverseMap;
        if (!r2) {
          r2 = this._reverseMap = [];
          for (var i2 = 0; i2 < n3.length; i2++)
            r2[n3.charCodeAt(i2)] = i2;
        }
        var o2 = n3.charAt(64);
        if (o2) {
          var a2 = e4.indexOf(o2);
          -1 !== a2 && (t4 = a2);
        }
        return s2(e4, t4, r2);
      }, _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=" };
    }(), n2.enc.Base64);
  });
  const c = "uni_id_token", u = "uni_id_token_expired", h = "uniIdToken", l = { DEFAULT: "FUNCTION", FUNCTION: "FUNCTION", OBJECT: "OBJECT", CLIENT_DB: "CLIENT_DB" }, d = "pending", p = "fulfilled", f = "rejected";
  function g(e2) {
    return Object.prototype.toString.call(e2).slice(8, -1).toLowerCase();
  }
  function m(e2) {
    return "object" === g(e2);
  }
  function y(e2) {
    return "function" == typeof e2;
  }
  function _(e2) {
    return function() {
      try {
        return e2.apply(e2, arguments);
      } catch (e3) {
        console.error(e3);
      }
    };
  }
  const w = "REJECTED", I = "NOT_PENDING";
  class v {
    constructor({ createPromise: e2, retryRule: t2 = w } = {}) {
      this.createPromise = e2, this.status = null, this.promise = null, this.retryRule = t2;
    }
    get needRetry() {
      if (!this.status)
        return true;
      switch (this.retryRule) {
        case w:
          return this.status === f;
        case I:
          return this.status !== d;
      }
    }
    exec() {
      return this.needRetry ? (this.status = d, this.promise = this.createPromise().then((e2) => (this.status = p, Promise.resolve(e2)), (e2) => (this.status = f, Promise.reject(e2))), this.promise) : this.promise;
    }
  }
  class S {
    constructor() {
      this._callback = {};
    }
    addListener(e2, t2) {
      this._callback[e2] || (this._callback[e2] = []), this._callback[e2].push(t2);
    }
    on(e2, t2) {
      return this.addListener(e2, t2);
    }
    removeListener(e2, t2) {
      if (!t2)
        throw new Error('The "listener" argument must be of type function. Received undefined');
      const n2 = this._callback[e2];
      if (!n2)
        return;
      const s2 = function(e3, t3) {
        for (let n3 = e3.length - 1; n3 >= 0; n3--)
          if (e3[n3] === t3)
            return n3;
        return -1;
      }(n2, t2);
      n2.splice(s2, 1);
    }
    off(e2, t2) {
      return this.removeListener(e2, t2);
    }
    removeAllListener(e2) {
      delete this._callback[e2];
    }
    emit(e2, ...t2) {
      const n2 = this._callback[e2];
      if (n2)
        for (let e3 = 0; e3 < n2.length; e3++)
          n2[e3](...t2);
    }
  }
  function T(e2) {
    return e2 && "string" == typeof e2 ? JSON.parse(e2) : e2;
  }
  const b = true, E = "app", A = T(define_process_env_UNI_SECURE_NETWORK_CONFIG_default), P = E, C = T('{"address":["127.0.0.1","192.168.1.222"],"servePort":7001,"debugPort":9001,"initialLaunchType":"local","skipFiles":["<node_internals>/**","E:/HBuilderX/plugins/unicloud/**/*.js"]}'), O = T('[{"provider":"aliyun","spaceName":"wordnew","spaceId":"mp-4b800ed8-579d-404c-a8fb-f0fc4beb1a1a","clientSecret":"hSEJluzCsjrHIHlTEgp7Ow==","endpoint":"https://api.next.bspapp.com"}]') || [];
  let N = "";
  try {
    N = "__UNI__9F3DDBE";
  } catch (e2) {
  }
  let R, L = {};
  function U(e2, t2 = {}) {
    var n2, s2;
    return n2 = L, s2 = e2, Object.prototype.hasOwnProperty.call(n2, s2) || (L[e2] = t2), L[e2];
  }
  function D() {
    return R || (R = function() {
      if ("undefined" != typeof globalThis)
        return globalThis;
      if ("undefined" != typeof self)
        return self;
      if ("undefined" != typeof window)
        return window;
      function e2() {
        return this;
      }
      return void 0 !== e2() ? e2() : new Function("return this")();
    }(), R);
  }
  L = uni._globalUniCloudObj ? uni._globalUniCloudObj : uni._globalUniCloudObj = {};
  const M = ["invoke", "success", "fail", "complete"], q = U("_globalUniCloudInterceptor");
  function F(e2, t2) {
    q[e2] || (q[e2] = {}), m(t2) && Object.keys(t2).forEach((n2) => {
      M.indexOf(n2) > -1 && function(e3, t3, n3) {
        let s2 = q[e3][t3];
        s2 || (s2 = q[e3][t3] = []), -1 === s2.indexOf(n3) && y(n3) && s2.push(n3);
      }(e2, n2, t2[n2]);
    });
  }
  function K(e2, t2) {
    q[e2] || (q[e2] = {}), m(t2) ? Object.keys(t2).forEach((n2) => {
      M.indexOf(n2) > -1 && function(e3, t3, n3) {
        const s2 = q[e3][t3];
        if (!s2)
          return;
        const r2 = s2.indexOf(n3);
        r2 > -1 && s2.splice(r2, 1);
      }(e2, n2, t2[n2]);
    }) : delete q[e2];
  }
  function j(e2, t2) {
    return e2 && 0 !== e2.length ? e2.reduce((e3, n2) => e3.then(() => n2(t2)), Promise.resolve()) : Promise.resolve();
  }
  function $(e2, t2) {
    return q[e2] && q[e2][t2] || [];
  }
  function B(e2) {
    F("callObject", e2);
  }
  const W = U("_globalUniCloudListener"), H = { RESPONSE: "response", NEED_LOGIN: "needLogin", REFRESH_TOKEN: "refreshToken" }, J = { CLIENT_DB: "clientdb", CLOUD_FUNCTION: "cloudfunction", CLOUD_OBJECT: "cloudobject" };
  function z(e2) {
    return W[e2] || (W[e2] = []), W[e2];
  }
  function V(e2, t2) {
    const n2 = z(e2);
    n2.includes(t2) || n2.push(t2);
  }
  function G(e2, t2) {
    const n2 = z(e2), s2 = n2.indexOf(t2);
    -1 !== s2 && n2.splice(s2, 1);
  }
  function Y(e2, t2) {
    const n2 = z(e2);
    for (let e3 = 0; e3 < n2.length; e3++) {
      (0, n2[e3])(t2);
    }
  }
  let Q, X = false;
  function Z() {
    return Q || (Q = new Promise((e2) => {
      X && e2(), function t2() {
        if ("function" == typeof getCurrentPages) {
          const t3 = getCurrentPages();
          t3 && t3[0] && (X = true, e2());
        }
        X || setTimeout(() => {
          t2();
        }, 30);
      }();
    }), Q);
  }
  function ee(e2) {
    const t2 = {};
    for (const n2 in e2) {
      const s2 = e2[n2];
      y(s2) && (t2[n2] = _(s2));
    }
    return t2;
  }
  class te extends Error {
    constructor(e2) {
      const t2 = e2.message || e2.errMsg || "unknown system error";
      super(t2), this.errMsg = t2, this.code = this.errCode = e2.code || e2.errCode || "SYSTEM_ERROR", this.errSubject = this.subject = e2.subject || e2.errSubject, this.cause = e2.cause, this.requestId = e2.requestId;
    }
    toJson(e2 = 0) {
      if (!(e2 >= 10))
        return e2++, { errCode: this.errCode, errMsg: this.errMsg, errSubject: this.errSubject, cause: this.cause && this.cause.toJson ? this.cause.toJson(e2) : this.cause };
    }
  }
  var ne = { request: (e2) => uni.request(e2), uploadFile: (e2) => uni.uploadFile(e2), setStorageSync: (e2, t2) => uni.setStorageSync(e2, t2), getStorageSync: (e2) => uni.getStorageSync(e2), removeStorageSync: (e2) => uni.removeStorageSync(e2), clearStorageSync: () => uni.clearStorageSync(), connectSocket: (e2) => uni.connectSocket(e2) };
  function se(e2) {
    return e2 && se(e2.__v_raw) || e2;
  }
  function re() {
    return { token: ne.getStorageSync(c) || ne.getStorageSync(h), tokenExpired: ne.getStorageSync(u) };
  }
  function ie({ token: e2, tokenExpired: t2 } = {}) {
    e2 && ne.setStorageSync(c, e2), t2 && ne.setStorageSync(u, t2);
  }
  let oe, ae;
  function ce() {
    return oe || (oe = uni.getSystemInfoSync()), oe;
  }
  function ue() {
    let e2, t2;
    try {
      if (uni.getLaunchOptionsSync) {
        if (uni.getLaunchOptionsSync.toString().indexOf("not yet implemented") > -1)
          return;
        const { scene: n2, channel: s2 } = uni.getLaunchOptionsSync();
        e2 = s2, t2 = n2;
      }
    } catch (e3) {
    }
    return { channel: e2, scene: t2 };
  }
  let he = {};
  function le() {
    const e2 = uni.getLocale && uni.getLocale() || "en";
    if (ae)
      return { ...he, ...ae, locale: e2, LOCALE: e2 };
    const t2 = ce(), { deviceId: n2, osName: s2, uniPlatform: r2, appId: i2 } = t2, o2 = ["appId", "appLanguage", "appName", "appVersion", "appVersionCode", "appWgtVersion", "browserName", "browserVersion", "deviceBrand", "deviceId", "deviceModel", "deviceType", "osName", "osVersion", "romName", "romVersion", "ua", "hostName", "hostVersion", "uniPlatform", "uniRuntimeVersion", "uniRuntimeVersionCode", "uniCompilerVersion", "uniCompilerVersionCode"];
    for (const e3 in t2)
      Object.hasOwnProperty.call(t2, e3) && -1 === o2.indexOf(e3) && delete t2[e3];
    return ae = { PLATFORM: r2, OS: s2, APPID: i2, DEVICEID: n2, ...ue(), ...t2 }, { ...he, ...ae, locale: e2, LOCALE: e2 };
  }
  var de = { sign: function(e2, t2) {
    let n2 = "";
    return Object.keys(e2).sort().forEach(function(t3) {
      e2[t3] && (n2 = n2 + "&" + t3 + "=" + e2[t3]);
    }), n2 = n2.slice(1), i(n2, t2).toString();
  }, wrappedRequest: function(e2, t2) {
    return new Promise((n2, s2) => {
      t2(Object.assign(e2, { complete(e3) {
        e3 || (e3 = {});
        const t3 = e3.data && e3.data.header && e3.data.header["x-serverless-request-id"] || e3.header && e3.header["request-id"];
        if (!e3.statusCode || e3.statusCode >= 400) {
          const n3 = e3.data && e3.data.error && e3.data.error.code || "SYS_ERR", r3 = e3.data && e3.data.error && e3.data.error.message || e3.errMsg || "request:fail";
          return s2(new te({ code: n3, message: r3, requestId: t3 }));
        }
        const r2 = e3.data;
        if (r2.error)
          return s2(new te({ code: r2.error.code, message: r2.error.message, requestId: t3 }));
        r2.result = r2.data, r2.requestId = t3, delete r2.data, n2(r2);
      } }));
    });
  }, toBase64: function(e2) {
    return a.stringify(o.parse(e2));
  } };
  var pe = class {
    constructor(e2) {
      ["spaceId", "clientSecret"].forEach((t2) => {
        if (!Object.prototype.hasOwnProperty.call(e2, t2))
          throw new Error(`${t2} required`);
      }), this.config = Object.assign({}, { endpoint: 0 === e2.spaceId.indexOf("mp-") ? "https://api.next.bspapp.com" : "https://api.bspapp.com" }, e2), this.config.provider = "aliyun", this.config.requestUrl = this.config.endpoint + "/client", this.config.envType = this.config.envType || "public", this.config.accessTokenKey = "access_token_" + this.config.spaceId, this.adapter = ne, this._getAccessTokenPromiseHub = new v({ createPromise: () => this.requestAuth(this.setupRequest({ method: "serverless.auth.user.anonymousAuthorize", params: "{}" }, "auth")).then((e3) => {
        if (!e3.result || !e3.result.accessToken)
          throw new te({ code: "AUTH_FAILED", message: "获取accessToken失败" });
        this.setAccessToken(e3.result.accessToken);
      }), retryRule: I });
    }
    get hasAccessToken() {
      return !!this.accessToken;
    }
    setAccessToken(e2) {
      this.accessToken = e2;
    }
    requestWrapped(e2) {
      return de.wrappedRequest(e2, this.adapter.request);
    }
    requestAuth(e2) {
      return this.requestWrapped(e2);
    }
    request(e2, t2) {
      return Promise.resolve().then(() => this.hasAccessToken ? t2 ? this.requestWrapped(e2) : this.requestWrapped(e2).catch((t3) => new Promise((e3, n2) => {
        !t3 || "GATEWAY_INVALID_TOKEN" !== t3.code && "InvalidParameter.InvalidToken" !== t3.code ? n2(t3) : e3();
      }).then(() => this.getAccessToken()).then(() => {
        const t4 = this.rebuildRequest(e2);
        return this.request(t4, true);
      })) : this.getAccessToken().then(() => {
        const t3 = this.rebuildRequest(e2);
        return this.request(t3, true);
      }));
    }
    rebuildRequest(e2) {
      const t2 = Object.assign({}, e2);
      return t2.data.token = this.accessToken, t2.header["x-basement-token"] = this.accessToken, t2.header["x-serverless-sign"] = de.sign(t2.data, this.config.clientSecret), t2;
    }
    setupRequest(e2, t2) {
      const n2 = Object.assign({}, e2, { spaceId: this.config.spaceId, timestamp: Date.now() }), s2 = { "Content-Type": "application/json" };
      return "auth" !== t2 && (n2.token = this.accessToken, s2["x-basement-token"] = this.accessToken), s2["x-serverless-sign"] = de.sign(n2, this.config.clientSecret), { url: this.config.requestUrl, method: "POST", data: n2, dataType: "json", header: s2 };
    }
    getAccessToken() {
      return this._getAccessTokenPromiseHub.exec();
    }
    async authorize() {
      await this.getAccessToken();
    }
    callFunction(e2) {
      const t2 = { method: "serverless.function.runtime.invoke", params: JSON.stringify({ functionTarget: e2.name, functionArgs: e2.data || {} }) };
      return this.request({ ...this.setupRequest(t2), timeout: e2.timeout });
    }
    getOSSUploadOptionsFromPath(e2) {
      const t2 = { method: "serverless.file.resource.generateProximalSign", params: JSON.stringify(e2) };
      return this.request(this.setupRequest(t2));
    }
    uploadFileToOSS({ url: e2, formData: t2, name: n2, filePath: s2, fileType: r2, onUploadProgress: i2 }) {
      return new Promise((o2, a2) => {
        const c2 = this.adapter.uploadFile({ url: e2, formData: t2, name: n2, filePath: s2, fileType: r2, header: { "X-OSS-server-side-encrpytion": "AES256" }, success(e3) {
          e3 && e3.statusCode < 400 ? o2(e3) : a2(new te({ code: "UPLOAD_FAILED", message: "文件上传失败" }));
        }, fail(e3) {
          a2(new te({ code: e3.code || "UPLOAD_FAILED", message: e3.message || e3.errMsg || "文件上传失败" }));
        } });
        "function" == typeof i2 && c2 && "function" == typeof c2.onProgressUpdate && c2.onProgressUpdate((e3) => {
          i2({ loaded: e3.totalBytesSent, total: e3.totalBytesExpectedToSend });
        });
      });
    }
    reportOSSUpload(e2) {
      const t2 = { method: "serverless.file.resource.report", params: JSON.stringify(e2) };
      return this.request(this.setupRequest(t2));
    }
    async uploadFile({ filePath: e2, cloudPath: t2, fileType: n2 = "image", cloudPathAsRealPath: s2 = false, onUploadProgress: r2, config: i2 }) {
      if ("string" !== g(t2))
        throw new te({ code: "INVALID_PARAM", message: "cloudPath必须为字符串类型" });
      if (!(t2 = t2.trim()))
        throw new te({ code: "INVALID_PARAM", message: "cloudPath不可为空" });
      if (/:\/\//.test(t2))
        throw new te({ code: "INVALID_PARAM", message: "cloudPath不合法" });
      const o2 = i2 && i2.envType || this.config.envType;
      if (s2 && ("/" !== t2[0] && (t2 = "/" + t2), t2.indexOf("\\") > -1))
        throw new te({ code: "INVALID_PARAM", message: "使用cloudPath作为路径时，cloudPath不可包含“\\”" });
      const a2 = (await this.getOSSUploadOptionsFromPath({ env: o2, filename: s2 ? t2.split("/").pop() : t2, fileId: s2 ? t2 : void 0 })).result, c2 = "https://" + a2.cdnDomain + "/" + a2.ossPath, { securityToken: u2, accessKeyId: h2, signature: l2, host: d2, ossPath: p2, id: f2, policy: m2, ossCallbackUrl: y2 } = a2, _2 = { "Cache-Control": "max-age=2592000", "Content-Disposition": "attachment", OSSAccessKeyId: h2, Signature: l2, host: d2, id: f2, key: p2, policy: m2, success_action_status: 200 };
      if (u2 && (_2["x-oss-security-token"] = u2), y2) {
        const e3 = JSON.stringify({ callbackUrl: y2, callbackBody: JSON.stringify({ fileId: f2, spaceId: this.config.spaceId }), callbackBodyType: "application/json" });
        _2.callback = de.toBase64(e3);
      }
      const w2 = { url: "https://" + a2.host, formData: _2, fileName: "file", name: "file", filePath: e2, fileType: n2 };
      if (await this.uploadFileToOSS(Object.assign({}, w2, { onUploadProgress: r2 })), y2)
        return { success: true, filePath: e2, fileID: c2 };
      if ((await this.reportOSSUpload({ id: f2 })).success)
        return { success: true, filePath: e2, fileID: c2 };
      throw new te({ code: "UPLOAD_FAILED", message: "文件上传失败" });
    }
    getTempFileURL({ fileList: e2 } = {}) {
      return new Promise((t2, n2) => {
        Array.isArray(e2) && 0 !== e2.length || n2(new te({ code: "INVALID_PARAM", message: "fileList的元素必须是非空的字符串" })), this.getFileInfo({ fileList: e2 }).then((n3) => {
          t2({ fileList: e2.map((e3, t3) => {
            const s2 = n3.fileList[t3];
            return { fileID: e3, tempFileURL: s2 && s2.url || e3 };
          }) });
        });
      });
    }
    async getFileInfo({ fileList: e2 } = {}) {
      if (!Array.isArray(e2) || 0 === e2.length)
        throw new te({ code: "INVALID_PARAM", message: "fileList的元素必须是非空的字符串" });
      const t2 = { method: "serverless.file.resource.info", params: JSON.stringify({ id: e2.map((e3) => e3.split("?")[0]).join(",") }) };
      return { fileList: (await this.request(this.setupRequest(t2))).result };
    }
  };
  var fe = { init(e2) {
    const t2 = new pe(e2), n2 = { signInAnonymously: function() {
      return t2.authorize();
    }, getLoginState: function() {
      return Promise.resolve(false);
    } };
    return t2.auth = function() {
      return n2;
    }, t2.customAuth = t2.auth, t2;
  } };
  const ge = "undefined" != typeof location && "http:" === location.protocol ? "http:" : "https:";
  var me;
  !function(e2) {
    e2.local = "local", e2.none = "none", e2.session = "session";
  }(me || (me = {}));
  var ye = function() {
  }, _e = n(function(e2, t2) {
    var n2;
    e2.exports = (n2 = r, function(e3) {
      var t3 = n2, s2 = t3.lib, r2 = s2.WordArray, i2 = s2.Hasher, o2 = t3.algo, a2 = [], c2 = [];
      !function() {
        function t4(t5) {
          for (var n4 = e3.sqrt(t5), s4 = 2; s4 <= n4; s4++)
            if (!(t5 % s4))
              return false;
          return true;
        }
        function n3(e4) {
          return 4294967296 * (e4 - (0 | e4)) | 0;
        }
        for (var s3 = 2, r3 = 0; r3 < 64; )
          t4(s3) && (r3 < 8 && (a2[r3] = n3(e3.pow(s3, 0.5))), c2[r3] = n3(e3.pow(s3, 1 / 3)), r3++), s3++;
      }();
      var u2 = [], h2 = o2.SHA256 = i2.extend({ _doReset: function() {
        this._hash = new r2.init(a2.slice(0));
      }, _doProcessBlock: function(e4, t4) {
        for (var n3 = this._hash.words, s3 = n3[0], r3 = n3[1], i3 = n3[2], o3 = n3[3], a3 = n3[4], h3 = n3[5], l2 = n3[6], d2 = n3[7], p2 = 0; p2 < 64; p2++) {
          if (p2 < 16)
            u2[p2] = 0 | e4[t4 + p2];
          else {
            var f2 = u2[p2 - 15], g2 = (f2 << 25 | f2 >>> 7) ^ (f2 << 14 | f2 >>> 18) ^ f2 >>> 3, m2 = u2[p2 - 2], y2 = (m2 << 15 | m2 >>> 17) ^ (m2 << 13 | m2 >>> 19) ^ m2 >>> 10;
            u2[p2] = g2 + u2[p2 - 7] + y2 + u2[p2 - 16];
          }
          var _2 = s3 & r3 ^ s3 & i3 ^ r3 & i3, w2 = (s3 << 30 | s3 >>> 2) ^ (s3 << 19 | s3 >>> 13) ^ (s3 << 10 | s3 >>> 22), I2 = d2 + ((a3 << 26 | a3 >>> 6) ^ (a3 << 21 | a3 >>> 11) ^ (a3 << 7 | a3 >>> 25)) + (a3 & h3 ^ ~a3 & l2) + c2[p2] + u2[p2];
          d2 = l2, l2 = h3, h3 = a3, a3 = o3 + I2 | 0, o3 = i3, i3 = r3, r3 = s3, s3 = I2 + (w2 + _2) | 0;
        }
        n3[0] = n3[0] + s3 | 0, n3[1] = n3[1] + r3 | 0, n3[2] = n3[2] + i3 | 0, n3[3] = n3[3] + o3 | 0, n3[4] = n3[4] + a3 | 0, n3[5] = n3[5] + h3 | 0, n3[6] = n3[6] + l2 | 0, n3[7] = n3[7] + d2 | 0;
      }, _doFinalize: function() {
        var t4 = this._data, n3 = t4.words, s3 = 8 * this._nDataBytes, r3 = 8 * t4.sigBytes;
        return n3[r3 >>> 5] |= 128 << 24 - r3 % 32, n3[14 + (r3 + 64 >>> 9 << 4)] = e3.floor(s3 / 4294967296), n3[15 + (r3 + 64 >>> 9 << 4)] = s3, t4.sigBytes = 4 * n3.length, this._process(), this._hash;
      }, clone: function() {
        var e4 = i2.clone.call(this);
        return e4._hash = this._hash.clone(), e4;
      } });
      t3.SHA256 = i2._createHelper(h2), t3.HmacSHA256 = i2._createHmacHelper(h2);
    }(Math), n2.SHA256);
  }), we = _e, Ie = n(function(e2, t2) {
    e2.exports = r.HmacSHA256;
  });
  const ve = () => {
    let e2;
    if (!Promise) {
      e2 = () => {
      }, e2.promise = {};
      const t3 = () => {
        throw new te({ message: 'Your Node runtime does support ES6 Promises. Set "global.Promise" to your preferred implementation of promises.' });
      };
      return Object.defineProperty(e2.promise, "then", { get: t3 }), Object.defineProperty(e2.promise, "catch", { get: t3 }), e2;
    }
    const t2 = new Promise((t3, n2) => {
      e2 = (e3, s2) => e3 ? n2(e3) : t3(s2);
    });
    return e2.promise = t2, e2;
  };
  function Se(e2) {
    return void 0 === e2;
  }
  function Te(e2) {
    return "[object Null]" === Object.prototype.toString.call(e2);
  }
  function be(e2 = "") {
    return e2.replace(/([\s\S]+)\s+(请前往云开发AI小助手查看问题：.*)/, "$1");
  }
  function Ee(e2 = 32) {
    const t2 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let n2 = "";
    for (let s2 = 0; s2 < e2; s2++)
      n2 += t2.charAt(Math.floor(62 * Math.random()));
    return n2;
  }
  var ke;
  function Ae(e2) {
    const t2 = (n2 = e2, "[object Array]" === Object.prototype.toString.call(n2) ? e2 : [e2]);
    var n2;
    for (const e3 of t2) {
      const { isMatch: t3, genAdapter: n3, runtime: s2 } = e3;
      if (t3())
        return { adapter: n3(), runtime: s2 };
    }
  }
  !function(e2) {
    e2.WEB = "web", e2.WX_MP = "wx_mp";
  }(ke || (ke = {}));
  const Pe = { adapter: null, runtime: void 0 }, Ce = ["anonymousUuidKey"];
  class Oe extends ye {
    constructor() {
      super(), Pe.adapter.root.tcbObject || (Pe.adapter.root.tcbObject = {});
    }
    setItem(e2, t2) {
      Pe.adapter.root.tcbObject[e2] = t2;
    }
    getItem(e2) {
      return Pe.adapter.root.tcbObject[e2];
    }
    removeItem(e2) {
      delete Pe.adapter.root.tcbObject[e2];
    }
    clear() {
      delete Pe.adapter.root.tcbObject;
    }
  }
  function xe(e2, t2) {
    switch (e2) {
      case "local":
        return t2.localStorage || new Oe();
      case "none":
        return new Oe();
      default:
        return t2.sessionStorage || new Oe();
    }
  }
  class Ne {
    constructor(e2) {
      if (!this._storage) {
        this._persistence = Pe.adapter.primaryStorage || e2.persistence, this._storage = xe(this._persistence, Pe.adapter);
        const t2 = `access_token_${e2.env}`, n2 = `access_token_expire_${e2.env}`, s2 = `refresh_token_${e2.env}`, r2 = `anonymous_uuid_${e2.env}`, i2 = `login_type_${e2.env}`, o2 = "device_id", a2 = `token_type_${e2.env}`, c2 = `user_info_${e2.env}`;
        this.keys = { accessTokenKey: t2, accessTokenExpireKey: n2, refreshTokenKey: s2, anonymousUuidKey: r2, loginTypeKey: i2, userInfoKey: c2, deviceIdKey: o2, tokenTypeKey: a2 };
      }
    }
    updatePersistence(e2) {
      if (e2 === this._persistence)
        return;
      const t2 = "local" === this._persistence;
      this._persistence = e2;
      const n2 = xe(e2, Pe.adapter);
      for (const e3 in this.keys) {
        const s2 = this.keys[e3];
        if (t2 && Ce.includes(e3))
          continue;
        const r2 = this._storage.getItem(s2);
        Se(r2) || Te(r2) || (n2.setItem(s2, r2), this._storage.removeItem(s2));
      }
      this._storage = n2;
    }
    setStore(e2, t2, n2) {
      if (!this._storage)
        return;
      const s2 = { version: n2 || "localCachev1", content: t2 }, r2 = JSON.stringify(s2);
      try {
        this._storage.setItem(e2, r2);
      } catch (e3) {
        throw e3;
      }
    }
    getStore(e2, t2) {
      try {
        if (!this._storage)
          return;
      } catch (e3) {
        return "";
      }
      t2 = t2 || "localCachev1";
      const n2 = this._storage.getItem(e2);
      if (!n2)
        return "";
      if (n2.indexOf(t2) >= 0) {
        return JSON.parse(n2).content;
      }
      return "";
    }
    removeStore(e2) {
      this._storage.removeItem(e2);
    }
  }
  const Re = {}, Le = {};
  function Ue(e2) {
    return Re[e2];
  }
  class De {
    constructor(e2, t2) {
      this.data = t2 || null, this.name = e2;
    }
  }
  class Me extends De {
    constructor(e2, t2) {
      super("error", { error: e2, data: t2 }), this.error = e2;
    }
  }
  const qe = new class {
    constructor() {
      this._listeners = {};
    }
    on(e2, t2) {
      return function(e3, t3, n2) {
        n2[e3] = n2[e3] || [], n2[e3].push(t3);
      }(e2, t2, this._listeners), this;
    }
    off(e2, t2) {
      return function(e3, t3, n2) {
        if (n2 && n2[e3]) {
          const s2 = n2[e3].indexOf(t3);
          -1 !== s2 && n2[e3].splice(s2, 1);
        }
      }(e2, t2, this._listeners), this;
    }
    fire(e2, t2) {
      if (e2 instanceof Me)
        return console.error(e2.error), this;
      const n2 = "string" == typeof e2 ? new De(e2, t2 || {}) : e2;
      const s2 = n2.name;
      if (this._listens(s2)) {
        n2.target = this;
        const e3 = this._listeners[s2] ? [...this._listeners[s2]] : [];
        for (const t3 of e3)
          t3.call(this, n2);
      }
      return this;
    }
    _listens(e2) {
      return this._listeners[e2] && this._listeners[e2].length > 0;
    }
  }();
  function Fe(e2, t2) {
    qe.on(e2, t2);
  }
  function Ke(e2, t2 = {}) {
    qe.fire(e2, t2);
  }
  function je(e2, t2) {
    qe.off(e2, t2);
  }
  const $e = "loginStateChanged", Be = "loginStateExpire", We = "loginTypeChanged", He = "anonymousConverted", Je = "refreshAccessToken";
  var ze;
  !function(e2) {
    e2.ANONYMOUS = "ANONYMOUS", e2.WECHAT = "WECHAT", e2.WECHAT_PUBLIC = "WECHAT-PUBLIC", e2.WECHAT_OPEN = "WECHAT-OPEN", e2.CUSTOM = "CUSTOM", e2.EMAIL = "EMAIL", e2.USERNAME = "USERNAME", e2.NULL = "NULL";
  }(ze || (ze = {}));
  class Ve {
    constructor() {
      this._fnPromiseMap = /* @__PURE__ */ new Map();
    }
    async run(e2, t2) {
      let n2 = this._fnPromiseMap.get(e2);
      return n2 || (n2 = new Promise(async (n3, s2) => {
        try {
          await this._runIdlePromise();
          const e3 = t2();
          n3(await e3);
        } catch (e3) {
          s2(e3);
        } finally {
          this._fnPromiseMap.delete(e2);
        }
      }), this._fnPromiseMap.set(e2, n2)), n2;
    }
    _runIdlePromise() {
      return Promise.resolve();
    }
  }
  class Ge {
    constructor(e2) {
      this._singlePromise = new Ve(), this._cache = Ue(e2.env), this._baseURL = `https://${e2.env}.ap-shanghai.tcb-api.tencentcloudapi.com`, this._reqClass = new Pe.adapter.reqClass({ timeout: e2.timeout, timeoutMsg: `请求在${e2.timeout / 1e3}s内未完成，已中断`, restrictedMethods: ["post"] });
    }
    _getDeviceId() {
      if (this._deviceID)
        return this._deviceID;
      const { deviceIdKey: e2 } = this._cache.keys;
      let t2 = this._cache.getStore(e2);
      return "string" == typeof t2 && t2.length >= 16 && t2.length <= 48 || (t2 = Ee(), this._cache.setStore(e2, t2)), this._deviceID = t2, t2;
    }
    async _request(e2, t2, n2 = {}) {
      const s2 = { "x-request-id": Ee(), "x-device-id": this._getDeviceId() };
      if (n2.withAccessToken) {
        const { tokenTypeKey: e3 } = this._cache.keys, t3 = await this.getAccessToken(), n3 = this._cache.getStore(e3);
        s2.authorization = `${n3} ${t3}`;
      }
      return this._reqClass["get" === n2.method ? "get" : "post"]({ url: `${this._baseURL}${e2}`, data: t2, headers: s2 });
    }
    async _fetchAccessToken() {
      const { loginTypeKey: e2, accessTokenKey: t2, accessTokenExpireKey: n2, tokenTypeKey: s2 } = this._cache.keys, r2 = this._cache.getStore(e2);
      if (r2 && r2 !== ze.ANONYMOUS)
        throw new te({ code: "INVALID_OPERATION", message: "非匿名登录不支持刷新 access token" });
      const i2 = await this._singlePromise.run("fetchAccessToken", async () => (await this._request("/auth/v1/signin/anonymously", {}, { method: "post" })).data), { access_token: o2, expires_in: a2, token_type: c2 } = i2;
      return this._cache.setStore(s2, c2), this._cache.setStore(t2, o2), this._cache.setStore(n2, Date.now() + 1e3 * a2), o2;
    }
    isAccessTokenExpired(e2, t2) {
      let n2 = true;
      return e2 && t2 && (n2 = t2 < Date.now()), n2;
    }
    async getAccessToken() {
      const { accessTokenKey: e2, accessTokenExpireKey: t2 } = this._cache.keys, n2 = this._cache.getStore(e2), s2 = this._cache.getStore(t2);
      return this.isAccessTokenExpired(n2, s2) ? this._fetchAccessToken() : n2;
    }
    async refreshAccessToken() {
      const { accessTokenKey: e2, accessTokenExpireKey: t2, loginTypeKey: n2 } = this._cache.keys;
      return this._cache.removeStore(e2), this._cache.removeStore(t2), this._cache.setStore(n2, ze.ANONYMOUS), this.getAccessToken();
    }
    async getUserInfo() {
      return this._singlePromise.run("getUserInfo", async () => (await this._request("/auth/v1/user/me", {}, { withAccessToken: true, method: "get" })).data);
    }
  }
  const Ye = ["auth.getJwt", "auth.logout", "auth.signInWithTicket", "auth.signInAnonymously", "auth.signIn", "auth.fetchAccessTokenWithRefreshToken", "auth.signUpWithEmailAndPassword", "auth.activateEndUserMail", "auth.sendPasswordResetEmail", "auth.resetPasswordWithToken", "auth.isUsernameRegistered"], Qe = { "X-SDK-Version": "1.3.5" };
  function Xe(e2, t2, n2) {
    const s2 = e2[t2];
    e2[t2] = function(t3) {
      const r2 = {}, i2 = {};
      n2.forEach((n3) => {
        const { data: s3, headers: o3 } = n3.call(e2, t3);
        Object.assign(r2, s3), Object.assign(i2, o3);
      });
      const o2 = t3.data;
      return o2 && (() => {
        var e3;
        if (e3 = o2, "[object FormData]" !== Object.prototype.toString.call(e3))
          t3.data = { ...o2, ...r2 };
        else
          for (const e4 in r2)
            o2.append(e4, r2[e4]);
      })(), t3.headers = { ...t3.headers || {}, ...i2 }, s2.call(e2, t3);
    };
  }
  function Ze() {
    const e2 = Math.random().toString(16).slice(2);
    return { data: { seqId: e2 }, headers: { ...Qe, "x-seqid": e2 } };
  }
  class et {
    constructor(e2 = {}) {
      var t2;
      this.config = e2, this._reqClass = new Pe.adapter.reqClass({ timeout: this.config.timeout, timeoutMsg: `请求在${this.config.timeout / 1e3}s内未完成，已中断`, restrictedMethods: ["post"] }), this._cache = Ue(this.config.env), this._localCache = (t2 = this.config.env, Le[t2]), this.oauth = new Ge(this.config), Xe(this._reqClass, "post", [Ze]), Xe(this._reqClass, "upload", [Ze]), Xe(this._reqClass, "download", [Ze]);
    }
    async post(e2) {
      return await this._reqClass.post(e2);
    }
    async upload(e2) {
      return await this._reqClass.upload(e2);
    }
    async download(e2) {
      return await this._reqClass.download(e2);
    }
    async refreshAccessToken() {
      let e2, t2;
      this._refreshAccessTokenPromise || (this._refreshAccessTokenPromise = this._refreshAccessToken());
      try {
        e2 = await this._refreshAccessTokenPromise;
      } catch (e3) {
        t2 = e3;
      }
      if (this._refreshAccessTokenPromise = null, this._shouldRefreshAccessTokenHook = null, t2)
        throw t2;
      return e2;
    }
    async _refreshAccessToken() {
      const { accessTokenKey: e2, accessTokenExpireKey: t2, refreshTokenKey: n2, loginTypeKey: s2, anonymousUuidKey: r2 } = this._cache.keys;
      this._cache.removeStore(e2), this._cache.removeStore(t2);
      let i2 = this._cache.getStore(n2);
      if (!i2)
        throw new te({ message: "未登录CloudBase" });
      const o2 = { refresh_token: i2 }, a2 = await this.request("auth.fetchAccessTokenWithRefreshToken", o2);
      if (a2.data.code) {
        const { code: e3 } = a2.data;
        if ("SIGN_PARAM_INVALID" === e3 || "REFRESH_TOKEN_EXPIRED" === e3 || "INVALID_REFRESH_TOKEN" === e3) {
          if (this._cache.getStore(s2) === ze.ANONYMOUS && "INVALID_REFRESH_TOKEN" === e3) {
            const e4 = this._cache.getStore(r2), t3 = this._cache.getStore(n2), s3 = await this.send("auth.signInAnonymously", { anonymous_uuid: e4, refresh_token: t3 });
            return this.setRefreshToken(s3.refresh_token), this._refreshAccessToken();
          }
          Ke(Be), this._cache.removeStore(n2);
        }
        throw new te({ code: a2.data.code, message: `刷新access token失败：${a2.data.code}` });
      }
      if (a2.data.access_token)
        return Ke(Je), this._cache.setStore(e2, a2.data.access_token), this._cache.setStore(t2, a2.data.access_token_expire + Date.now()), { accessToken: a2.data.access_token, accessTokenExpire: a2.data.access_token_expire };
      a2.data.refresh_token && (this._cache.removeStore(n2), this._cache.setStore(n2, a2.data.refresh_token), this._refreshAccessToken());
    }
    async getAccessToken() {
      const { accessTokenKey: e2, accessTokenExpireKey: t2, refreshTokenKey: n2 } = this._cache.keys;
      if (!this._cache.getStore(n2))
        throw new te({ message: "refresh token不存在，登录状态异常" });
      let s2 = this._cache.getStore(e2), r2 = this._cache.getStore(t2), i2 = true;
      return this._shouldRefreshAccessTokenHook && !await this._shouldRefreshAccessTokenHook(s2, r2) && (i2 = false), (!s2 || !r2 || r2 < Date.now()) && i2 ? this.refreshAccessToken() : { accessToken: s2, accessTokenExpire: r2 };
    }
    async request(e2, t2, n2) {
      const s2 = `x-tcb-trace_${this.config.env}`;
      let r2 = "application/x-www-form-urlencoded";
      const i2 = { action: e2, env: this.config.env, dataVersion: "2019-08-16", ...t2 };
      let o2;
      if (-1 === Ye.indexOf(e2) && (this._cache.keys, i2.access_token = await this.oauth.getAccessToken()), "storage.uploadFile" === e2) {
        o2 = new FormData();
        for (let e3 in o2)
          o2.hasOwnProperty(e3) && void 0 !== o2[e3] && o2.append(e3, i2[e3]);
        r2 = "multipart/form-data";
      } else {
        r2 = "application/json", o2 = {};
        for (let e3 in i2)
          void 0 !== i2[e3] && (o2[e3] = i2[e3]);
      }
      let a2 = { headers: { "content-type": r2 } };
      n2 && n2.timeout && (a2.timeout = n2.timeout), n2 && n2.onUploadProgress && (a2.onUploadProgress = n2.onUploadProgress);
      const c2 = this._localCache.getStore(s2);
      c2 && (a2.headers["X-TCB-Trace"] = c2);
      const { parse: u2, inQuery: h2, search: l2 } = t2;
      let d2 = { env: this.config.env };
      u2 && (d2.parse = true), h2 && (d2 = { ...h2, ...d2 });
      let p2 = function(e3, t3, n3 = {}) {
        const s3 = /\?/.test(t3);
        let r3 = "";
        for (let e4 in n3)
          "" === r3 ? !s3 && (t3 += "?") : r3 += "&", r3 += `${e4}=${encodeURIComponent(n3[e4])}`;
        return /^http(s)?\:\/\//.test(t3 += r3) ? t3 : `${e3}${t3}`;
      }(ge, "//tcb-api.tencentcloudapi.com/web", d2);
      l2 && (p2 += l2);
      const f2 = await this.post({ url: p2, data: o2, ...a2 }), g2 = f2.header && f2.header["x-tcb-trace"];
      if (g2 && this._localCache.setStore(s2, g2), 200 !== Number(f2.status) && 200 !== Number(f2.statusCode) || !f2.data)
        throw new te({ code: "NETWORK_ERROR", message: "network request error" });
      return f2;
    }
    async send(e2, t2 = {}, n2 = {}) {
      const s2 = await this.request(e2, t2, { ...n2, onUploadProgress: t2.onUploadProgress });
      if (("ACCESS_TOKEN_DISABLED" === s2.data.code || "ACCESS_TOKEN_EXPIRED" === s2.data.code) && -1 === Ye.indexOf(e2)) {
        await this.oauth.refreshAccessToken();
        const s3 = await this.request(e2, t2, { ...n2, onUploadProgress: t2.onUploadProgress });
        if (s3.data.code)
          throw new te({ code: s3.data.code, message: be(s3.data.message) });
        return s3.data;
      }
      if (s2.data.code)
        throw new te({ code: s2.data.code, message: be(s2.data.message) });
      return s2.data;
    }
    setRefreshToken(e2) {
      const { accessTokenKey: t2, accessTokenExpireKey: n2, refreshTokenKey: s2 } = this._cache.keys;
      this._cache.removeStore(t2), this._cache.removeStore(n2), this._cache.setStore(s2, e2);
    }
  }
  const tt = {};
  function nt(e2) {
    return tt[e2];
  }
  class st {
    constructor(e2) {
      this.config = e2, this._cache = Ue(e2.env), this._request = nt(e2.env);
    }
    setRefreshToken(e2) {
      const { accessTokenKey: t2, accessTokenExpireKey: n2, refreshTokenKey: s2 } = this._cache.keys;
      this._cache.removeStore(t2), this._cache.removeStore(n2), this._cache.setStore(s2, e2);
    }
    setAccessToken(e2, t2) {
      const { accessTokenKey: n2, accessTokenExpireKey: s2 } = this._cache.keys;
      this._cache.setStore(n2, e2), this._cache.setStore(s2, t2);
    }
    async refreshUserInfo() {
      const { data: e2 } = await this._request.send("auth.getUserInfo", {});
      return this.setLocalUserInfo(e2), e2;
    }
    setLocalUserInfo(e2) {
      const { userInfoKey: t2 } = this._cache.keys;
      this._cache.setStore(t2, e2);
    }
  }
  class rt {
    constructor(e2) {
      if (!e2)
        throw new te({ code: "PARAM_ERROR", message: "envId is not defined" });
      this._envId = e2, this._cache = Ue(this._envId), this._request = nt(this._envId), this.setUserInfo();
    }
    linkWithTicket(e2) {
      if ("string" != typeof e2)
        throw new te({ code: "PARAM_ERROR", message: "ticket must be string" });
      return this._request.send("auth.linkWithTicket", { ticket: e2 });
    }
    linkWithRedirect(e2) {
      e2.signInWithRedirect();
    }
    updatePassword(e2, t2) {
      return this._request.send("auth.updatePassword", { oldPassword: t2, newPassword: e2 });
    }
    updateEmail(e2) {
      return this._request.send("auth.updateEmail", { newEmail: e2 });
    }
    updateUsername(e2) {
      if ("string" != typeof e2)
        throw new te({ code: "PARAM_ERROR", message: "username must be a string" });
      return this._request.send("auth.updateUsername", { username: e2 });
    }
    async getLinkedUidList() {
      const { data: e2 } = await this._request.send("auth.getLinkedUidList", {});
      let t2 = false;
      const { users: n2 } = e2;
      return n2.forEach((e3) => {
        e3.wxOpenId && e3.wxPublicId && (t2 = true);
      }), { users: n2, hasPrimaryUid: t2 };
    }
    setPrimaryUid(e2) {
      return this._request.send("auth.setPrimaryUid", { uid: e2 });
    }
    unlink(e2) {
      return this._request.send("auth.unlink", { platform: e2 });
    }
    async update(e2) {
      const { nickName: t2, gender: n2, avatarUrl: s2, province: r2, country: i2, city: o2 } = e2, { data: a2 } = await this._request.send("auth.updateUserInfo", { nickName: t2, gender: n2, avatarUrl: s2, province: r2, country: i2, city: o2 });
      this.setLocalUserInfo(a2);
    }
    async refresh() {
      const e2 = await this._request.oauth.getUserInfo();
      return this.setLocalUserInfo(e2), e2;
    }
    setUserInfo() {
      const { userInfoKey: e2 } = this._cache.keys, t2 = this._cache.getStore(e2);
      ["uid", "loginType", "openid", "wxOpenId", "wxPublicId", "unionId", "qqMiniOpenId", "email", "hasPassword", "customUserId", "nickName", "gender", "avatarUrl"].forEach((e3) => {
        this[e3] = t2[e3];
      }), this.location = { country: t2.country, province: t2.province, city: t2.city };
    }
    setLocalUserInfo(e2) {
      const { userInfoKey: t2 } = this._cache.keys;
      this._cache.setStore(t2, e2), this.setUserInfo();
    }
  }
  class it {
    constructor(e2) {
      if (!e2)
        throw new te({ code: "PARAM_ERROR", message: "envId is not defined" });
      this._cache = Ue(e2);
      const { refreshTokenKey: t2, accessTokenKey: n2, accessTokenExpireKey: s2 } = this._cache.keys, r2 = this._cache.getStore(t2), i2 = this._cache.getStore(n2), o2 = this._cache.getStore(s2);
      this.credential = { refreshToken: r2, accessToken: i2, accessTokenExpire: o2 }, this.user = new rt(e2);
    }
    get isAnonymousAuth() {
      return this.loginType === ze.ANONYMOUS;
    }
    get isCustomAuth() {
      return this.loginType === ze.CUSTOM;
    }
    get isWeixinAuth() {
      return this.loginType === ze.WECHAT || this.loginType === ze.WECHAT_OPEN || this.loginType === ze.WECHAT_PUBLIC;
    }
    get loginType() {
      return this._cache.getStore(this._cache.keys.loginTypeKey);
    }
  }
  class ot extends st {
    async signIn() {
      this._cache.updatePersistence("local"), await this._request.oauth.getAccessToken(), Ke($e), Ke(We, { env: this.config.env, loginType: ze.ANONYMOUS, persistence: "local" });
      const e2 = new it(this.config.env);
      return await e2.user.refresh(), e2;
    }
    async linkAndRetrieveDataWithTicket(e2) {
      const { anonymousUuidKey: t2, refreshTokenKey: n2 } = this._cache.keys, s2 = this._cache.getStore(t2), r2 = this._cache.getStore(n2), i2 = await this._request.send("auth.linkAndRetrieveDataWithTicket", { anonymous_uuid: s2, refresh_token: r2, ticket: e2 });
      if (i2.refresh_token)
        return this._clearAnonymousUUID(), this.setRefreshToken(i2.refresh_token), await this._request.refreshAccessToken(), Ke(He, { env: this.config.env }), Ke(We, { loginType: ze.CUSTOM, persistence: "local" }), { credential: { refreshToken: i2.refresh_token } };
      throw new te({ message: "匿名转化失败" });
    }
    _setAnonymousUUID(e2) {
      const { anonymousUuidKey: t2, loginTypeKey: n2 } = this._cache.keys;
      this._cache.removeStore(t2), this._cache.setStore(t2, e2), this._cache.setStore(n2, ze.ANONYMOUS);
    }
    _clearAnonymousUUID() {
      this._cache.removeStore(this._cache.keys.anonymousUuidKey);
    }
  }
  class at extends st {
    async signIn(e2) {
      if ("string" != typeof e2)
        throw new te({ code: "PARAM_ERROR", message: "ticket must be a string" });
      const { refreshTokenKey: t2 } = this._cache.keys, n2 = await this._request.send("auth.signInWithTicket", { ticket: e2, refresh_token: this._cache.getStore(t2) || "" });
      if (n2.refresh_token)
        return this.setRefreshToken(n2.refresh_token), await this._request.refreshAccessToken(), Ke($e), Ke(We, { env: this.config.env, loginType: ze.CUSTOM, persistence: this.config.persistence }), await this.refreshUserInfo(), new it(this.config.env);
      throw new te({ message: "自定义登录失败" });
    }
  }
  class ct extends st {
    async signIn(e2, t2) {
      if ("string" != typeof e2)
        throw new te({ code: "PARAM_ERROR", message: "email must be a string" });
      const { refreshTokenKey: n2 } = this._cache.keys, s2 = await this._request.send("auth.signIn", { loginType: "EMAIL", email: e2, password: t2, refresh_token: this._cache.getStore(n2) || "" }), { refresh_token: r2, access_token: i2, access_token_expire: o2 } = s2;
      if (r2)
        return this.setRefreshToken(r2), i2 && o2 ? this.setAccessToken(i2, o2) : await this._request.refreshAccessToken(), await this.refreshUserInfo(), Ke($e), Ke(We, { env: this.config.env, loginType: ze.EMAIL, persistence: this.config.persistence }), new it(this.config.env);
      throw s2.code ? new te({ code: s2.code, message: `邮箱登录失败: ${s2.message}` }) : new te({ message: "邮箱登录失败" });
    }
    async activate(e2) {
      return this._request.send("auth.activateEndUserMail", { token: e2 });
    }
    async resetPasswordWithToken(e2, t2) {
      return this._request.send("auth.resetPasswordWithToken", { token: e2, newPassword: t2 });
    }
  }
  class ut extends st {
    async signIn(e2, t2) {
      if ("string" != typeof e2)
        throw new te({ code: "PARAM_ERROR", message: "username must be a string" });
      "string" != typeof t2 && (t2 = "", console.warn("password is empty"));
      const { refreshTokenKey: n2 } = this._cache.keys, s2 = await this._request.send("auth.signIn", { loginType: ze.USERNAME, username: e2, password: t2, refresh_token: this._cache.getStore(n2) || "" }), { refresh_token: r2, access_token_expire: i2, access_token: o2 } = s2;
      if (r2)
        return this.setRefreshToken(r2), o2 && i2 ? this.setAccessToken(o2, i2) : await this._request.refreshAccessToken(), await this.refreshUserInfo(), Ke($e), Ke(We, { env: this.config.env, loginType: ze.USERNAME, persistence: this.config.persistence }), new it(this.config.env);
      throw s2.code ? new te({ code: s2.code, message: `用户名密码登录失败: ${s2.message}` }) : new te({ message: "用户名密码登录失败" });
    }
  }
  class ht {
    constructor(e2) {
      this.config = e2, this._cache = Ue(e2.env), this._request = nt(e2.env), this._onAnonymousConverted = this._onAnonymousConverted.bind(this), this._onLoginTypeChanged = this._onLoginTypeChanged.bind(this), Fe(We, this._onLoginTypeChanged);
    }
    get currentUser() {
      const e2 = this.hasLoginState();
      return e2 && e2.user || null;
    }
    get loginType() {
      return this._cache.getStore(this._cache.keys.loginTypeKey);
    }
    anonymousAuthProvider() {
      return new ot(this.config);
    }
    customAuthProvider() {
      return new at(this.config);
    }
    emailAuthProvider() {
      return new ct(this.config);
    }
    usernameAuthProvider() {
      return new ut(this.config);
    }
    async signInAnonymously() {
      return new ot(this.config).signIn();
    }
    async signInWithEmailAndPassword(e2, t2) {
      return new ct(this.config).signIn(e2, t2);
    }
    signInWithUsernameAndPassword(e2, t2) {
      return new ut(this.config).signIn(e2, t2);
    }
    async linkAndRetrieveDataWithTicket(e2) {
      this._anonymousAuthProvider || (this._anonymousAuthProvider = new ot(this.config)), Fe(He, this._onAnonymousConverted);
      return await this._anonymousAuthProvider.linkAndRetrieveDataWithTicket(e2);
    }
    async signOut() {
      if (this.loginType === ze.ANONYMOUS)
        throw new te({ message: "匿名用户不支持登出操作" });
      const { refreshTokenKey: e2, accessTokenKey: t2, accessTokenExpireKey: n2 } = this._cache.keys, s2 = this._cache.getStore(e2);
      if (!s2)
        return;
      const r2 = await this._request.send("auth.logout", { refresh_token: s2 });
      return this._cache.removeStore(e2), this._cache.removeStore(t2), this._cache.removeStore(n2), Ke($e), Ke(We, { env: this.config.env, loginType: ze.NULL, persistence: this.config.persistence }), r2;
    }
    async signUpWithEmailAndPassword(e2, t2) {
      return this._request.send("auth.signUpWithEmailAndPassword", { email: e2, password: t2 });
    }
    async sendPasswordResetEmail(e2) {
      return this._request.send("auth.sendPasswordResetEmail", { email: e2 });
    }
    onLoginStateChanged(e2) {
      Fe($e, () => {
        const t3 = this.hasLoginState();
        e2.call(this, t3);
      });
      const t2 = this.hasLoginState();
      e2.call(this, t2);
    }
    onLoginStateExpired(e2) {
      Fe(Be, e2.bind(this));
    }
    onAccessTokenRefreshed(e2) {
      Fe(Je, e2.bind(this));
    }
    onAnonymousConverted(e2) {
      Fe(He, e2.bind(this));
    }
    onLoginTypeChanged(e2) {
      Fe(We, () => {
        const t2 = this.hasLoginState();
        e2.call(this, t2);
      });
    }
    async getAccessToken() {
      return { accessToken: (await this._request.getAccessToken()).accessToken, env: this.config.env };
    }
    hasLoginState() {
      const { accessTokenKey: e2, accessTokenExpireKey: t2 } = this._cache.keys, n2 = this._cache.getStore(e2), s2 = this._cache.getStore(t2);
      return this._request.oauth.isAccessTokenExpired(n2, s2) ? null : new it(this.config.env);
    }
    async isUsernameRegistered(e2) {
      if ("string" != typeof e2)
        throw new te({ code: "PARAM_ERROR", message: "username must be a string" });
      const { data: t2 } = await this._request.send("auth.isUsernameRegistered", { username: e2 });
      return t2 && t2.isRegistered;
    }
    getLoginState() {
      return Promise.resolve(this.hasLoginState());
    }
    async signInWithTicket(e2) {
      return new at(this.config).signIn(e2);
    }
    shouldRefreshAccessToken(e2) {
      this._request._shouldRefreshAccessTokenHook = e2.bind(this);
    }
    getUserInfo() {
      return this._request.send("auth.getUserInfo", {}).then((e2) => e2.code ? e2 : { ...e2.data, requestId: e2.seqId });
    }
    getAuthHeader() {
      const { refreshTokenKey: e2, accessTokenKey: t2 } = this._cache.keys, n2 = this._cache.getStore(e2);
      return { "x-cloudbase-credentials": this._cache.getStore(t2) + "/@@/" + n2 };
    }
    _onAnonymousConverted(e2) {
      const { env: t2 } = e2.data;
      t2 === this.config.env && this._cache.updatePersistence(this.config.persistence);
    }
    _onLoginTypeChanged(e2) {
      const { loginType: t2, persistence: n2, env: s2 } = e2.data;
      s2 === this.config.env && (this._cache.updatePersistence(n2), this._cache.setStore(this._cache.keys.loginTypeKey, t2));
    }
  }
  const lt = function(e2, t2) {
    t2 = t2 || ve();
    const n2 = nt(this.config.env), { cloudPath: s2, filePath: r2, onUploadProgress: i2, fileType: o2 = "image" } = e2;
    return n2.send("storage.getUploadMetadata", { path: s2 }).then((e3) => {
      const { data: { url: a2, authorization: c2, token: u2, fileId: h2, cosFileId: l2 }, requestId: d2 } = e3, p2 = { key: s2, signature: c2, "x-cos-meta-fileid": l2, success_action_status: "201", "x-cos-security-token": u2 };
      n2.upload({ url: a2, data: p2, file: r2, name: s2, fileType: o2, onUploadProgress: i2 }).then((e4) => {
        201 === e4.statusCode ? t2(null, { fileID: h2, requestId: d2 }) : t2(new te({ code: "STORAGE_REQUEST_FAIL", message: `STORAGE_REQUEST_FAIL: ${e4.data}` }));
      }).catch((e4) => {
        t2(e4);
      });
    }).catch((e3) => {
      t2(e3);
    }), t2.promise;
  }, dt = function(e2, t2) {
    t2 = t2 || ve();
    const n2 = nt(this.config.env), { cloudPath: s2 } = e2;
    return n2.send("storage.getUploadMetadata", { path: s2 }).then((e3) => {
      t2(null, e3);
    }).catch((e3) => {
      t2(e3);
    }), t2.promise;
  }, pt = function({ fileList: e2 }, t2) {
    if (t2 = t2 || ve(), !e2 || !Array.isArray(e2))
      return { code: "INVALID_PARAM", message: "fileList必须是非空的数组" };
    for (let t3 of e2)
      if (!t3 || "string" != typeof t3)
        return { code: "INVALID_PARAM", message: "fileList的元素必须是非空的字符串" };
    const n2 = { fileid_list: e2 };
    return nt(this.config.env).send("storage.batchDeleteFile", n2).then((e3) => {
      e3.code ? t2(null, e3) : t2(null, { fileList: e3.data.delete_list, requestId: e3.requestId });
    }).catch((e3) => {
      t2(e3);
    }), t2.promise;
  }, ft = function({ fileList: e2 }, t2) {
    t2 = t2 || ve(), e2 && Array.isArray(e2) || t2(null, { code: "INVALID_PARAM", message: "fileList必须是非空的数组" });
    let n2 = [];
    for (let s3 of e2)
      "object" == typeof s3 ? (s3.hasOwnProperty("fileID") && s3.hasOwnProperty("maxAge") || t2(null, { code: "INVALID_PARAM", message: "fileList的元素必须是包含fileID和maxAge的对象" }), n2.push({ fileid: s3.fileID, max_age: s3.maxAge })) : "string" == typeof s3 ? n2.push({ fileid: s3 }) : t2(null, { code: "INVALID_PARAM", message: "fileList的元素必须是字符串" });
    const s2 = { file_list: n2 };
    return nt(this.config.env).send("storage.batchGetDownloadUrl", s2).then((e3) => {
      e3.code ? t2(null, e3) : t2(null, { fileList: e3.data.download_list, requestId: e3.requestId });
    }).catch((e3) => {
      t2(e3);
    }), t2.promise;
  }, gt = async function({ fileID: e2 }, t2) {
    const n2 = (await ft.call(this, { fileList: [{ fileID: e2, maxAge: 600 }] })).fileList[0];
    if ("SUCCESS" !== n2.code)
      return t2 ? t2(n2) : new Promise((e3) => {
        e3(n2);
      });
    const s2 = nt(this.config.env);
    let r2 = n2.download_url;
    if (r2 = encodeURI(r2), !t2)
      return s2.download({ url: r2 });
    t2(await s2.download({ url: r2 }));
  }, mt = function({ name: e2, data: t2, query: n2, parse: s2, search: r2, timeout: i2 }, o2) {
    const a2 = o2 || ve();
    let c2;
    try {
      c2 = t2 ? JSON.stringify(t2) : "";
    } catch (e3) {
      return Promise.reject(e3);
    }
    if (!e2)
      return Promise.reject(new te({ code: "PARAM_ERROR", message: "函数名不能为空" }));
    const u2 = { inQuery: n2, parse: s2, search: r2, function_name: e2, request_data: c2 };
    return nt(this.config.env).send("functions.invokeFunction", u2, { timeout: i2 }).then((e3) => {
      if (e3.code)
        a2(null, e3);
      else {
        let t3 = e3.data.response_data;
        if (s2)
          a2(null, { result: t3, requestId: e3.requestId });
        else
          try {
            t3 = JSON.parse(e3.data.response_data), a2(null, { result: t3, requestId: e3.requestId });
          } catch (e4) {
            a2(new te({ message: "response data must be json" }));
          }
      }
      return a2.promise;
    }).catch((e3) => {
      a2(e3);
    }), a2.promise;
  }, yt = { timeout: 15e3, persistence: "session" }, _t = 6e5, wt = {};
  class It {
    constructor(e2) {
      this.config = e2 || this.config, this.authObj = void 0;
    }
    init(e2) {
      switch (Pe.adapter || (this.requestClient = new Pe.adapter.reqClass({ timeout: e2.timeout || 5e3, timeoutMsg: `请求在${(e2.timeout || 5e3) / 1e3}s内未完成，已中断` })), this.config = { ...yt, ...e2 }, true) {
        case this.config.timeout > _t:
          console.warn("timeout大于可配置上限[10分钟]，已重置为上限数值"), this.config.timeout = _t;
          break;
        case this.config.timeout < 100:
          console.warn("timeout小于可配置下限[100ms]，已重置为下限数值"), this.config.timeout = 100;
      }
      return new It(this.config);
    }
    auth({ persistence: e2 } = {}) {
      if (this.authObj)
        return this.authObj;
      const t2 = e2 || Pe.adapter.primaryStorage || yt.persistence;
      var n2;
      return t2 !== this.config.persistence && (this.config.persistence = t2), function(e3) {
        const { env: t3 } = e3;
        Re[t3] = new Ne(e3), Le[t3] = new Ne({ ...e3, persistence: "local" });
      }(this.config), n2 = this.config, tt[n2.env] = new et(n2), this.authObj = new ht(this.config), this.authObj;
    }
    on(e2, t2) {
      return Fe.apply(this, [e2, t2]);
    }
    off(e2, t2) {
      return je.apply(this, [e2, t2]);
    }
    callFunction(e2, t2) {
      return mt.apply(this, [e2, t2]);
    }
    deleteFile(e2, t2) {
      return pt.apply(this, [e2, t2]);
    }
    getTempFileURL(e2, t2) {
      return ft.apply(this, [e2, t2]);
    }
    downloadFile(e2, t2) {
      return gt.apply(this, [e2, t2]);
    }
    uploadFile(e2, t2) {
      return lt.apply(this, [e2, t2]);
    }
    getUploadMetadata(e2, t2) {
      return dt.apply(this, [e2, t2]);
    }
    registerExtension(e2) {
      wt[e2.name] = e2;
    }
    async invokeExtension(e2, t2) {
      const n2 = wt[e2];
      if (!n2)
        throw new te({ message: `扩展${e2} 必须先注册` });
      return await n2.invoke(t2, this);
    }
    useAdapters(e2) {
      const { adapter: t2, runtime: n2 } = Ae(e2) || {};
      t2 && (Pe.adapter = t2), n2 && (Pe.runtime = n2);
    }
  }
  var vt = new It();
  function St(e2, t2, n2) {
    void 0 === n2 && (n2 = {});
    var s2 = /\?/.test(t2), r2 = "";
    for (var i2 in n2)
      "" === r2 ? !s2 && (t2 += "?") : r2 += "&", r2 += i2 + "=" + encodeURIComponent(n2[i2]);
    return /^http(s)?:\/\//.test(t2 += r2) ? t2 : "" + e2 + t2;
  }
  class Tt {
    get(e2) {
      const { url: t2, data: n2, headers: s2, timeout: r2 } = e2;
      return new Promise((e3, i2) => {
        ne.request({ url: St("https:", t2), data: n2, method: "GET", header: s2, timeout: r2, success(t3) {
          e3(t3);
        }, fail(e4) {
          i2(e4);
        } });
      });
    }
    post(e2) {
      const { url: t2, data: n2, headers: s2, timeout: r2 } = e2;
      return new Promise((e3, i2) => {
        ne.request({ url: St("https:", t2), data: n2, method: "POST", header: s2, timeout: r2, success(t3) {
          e3(t3);
        }, fail(e4) {
          i2(e4);
        } });
      });
    }
    upload(e2) {
      return new Promise((t2, n2) => {
        const { url: s2, file: r2, data: i2, headers: o2, fileType: a2 } = e2, c2 = ne.uploadFile({ url: St("https:", s2), name: "file", formData: Object.assign({}, i2), filePath: r2, fileType: a2, header: o2, success(e3) {
          const n3 = { statusCode: e3.statusCode, data: e3.data || {} };
          200 === e3.statusCode && i2.success_action_status && (n3.statusCode = parseInt(i2.success_action_status, 10)), t2(n3);
        }, fail(e3) {
          n2(new Error(e3.errMsg || "uploadFile:fail"));
        } });
        "function" == typeof e2.onUploadProgress && c2 && "function" == typeof c2.onProgressUpdate && c2.onProgressUpdate((t3) => {
          e2.onUploadProgress({ loaded: t3.totalBytesSent, total: t3.totalBytesExpectedToSend });
        });
      });
    }
  }
  const bt = { setItem(e2, t2) {
    ne.setStorageSync(e2, t2);
  }, getItem: (e2) => ne.getStorageSync(e2), removeItem(e2) {
    ne.removeStorageSync(e2);
  }, clear() {
    ne.clearStorageSync();
  } };
  var Et = { genAdapter: function() {
    return { root: {}, reqClass: Tt, localStorage: bt, primaryStorage: "local" };
  }, isMatch: function() {
    return true;
  }, runtime: "uni_app" };
  vt.useAdapters(Et);
  const kt = vt, At = kt.init;
  kt.init = function(e2) {
    e2.env = e2.spaceId;
    const t2 = At.call(this, e2);
    t2.config.provider = "tencent", t2.config.spaceId = e2.spaceId;
    const n2 = t2.auth;
    return t2.auth = function(e3) {
      const t3 = n2.call(this, e3);
      return ["linkAndRetrieveDataWithTicket", "signInAnonymously", "signOut", "getAccessToken", "getLoginState", "signInWithTicket", "getUserInfo"].forEach((e4) => {
        var n3;
        t3[e4] = (n3 = t3[e4], function(e5) {
          e5 = e5 || {};
          const { success: t4, fail: s2, complete: r2 } = ee(e5);
          if (!(t4 || s2 || r2))
            return n3.call(this, e5);
          n3.call(this, e5).then((e6) => {
            t4 && t4(e6), r2 && r2(e6);
          }, (e6) => {
            s2 && s2(e6), r2 && r2(e6);
          });
        }).bind(t3);
      }), t3;
    }, t2.customAuth = t2.auth, t2;
  };
  var Pt = kt;
  async function Ct(e2, t2) {
    const n2 = `http://${e2}:${t2}/system/ping`;
    try {
      const e3 = await (s2 = { url: n2, timeout: 500 }, new Promise((e4, t3) => {
        ne.request({ ...s2, success(t4) {
          e4(t4);
        }, fail(e5) {
          t3(e5);
        } });
      }));
      return !(!e3.data || 0 !== e3.data.code);
    } catch (e3) {
      return false;
    }
    var s2;
  }
  async function Ot(e2, t2) {
    let n2;
    for (let s2 = 0; s2 < e2.length; s2++) {
      const r2 = e2[s2];
      if (await Ct(r2, t2)) {
        n2 = r2;
        break;
      }
    }
    return { address: n2, port: t2 };
  }
  const xt = { "serverless.file.resource.generateProximalSign": "storage/generate-proximal-sign", "serverless.file.resource.report": "storage/report", "serverless.file.resource.delete": "storage/delete", "serverless.file.resource.getTempFileURL": "storage/get-temp-file-url" };
  var Nt = class {
    constructor(e2) {
      if (["spaceId", "clientSecret"].forEach((t2) => {
        if (!Object.prototype.hasOwnProperty.call(e2, t2))
          throw new Error(`${t2} required`);
      }), !e2.endpoint)
        throw new Error("集群空间未配置ApiEndpoint，配置后需要重新关联服务空间后生效");
      this.config = Object.assign({}, e2), this.config.provider = "dcloud", this.config.requestUrl = this.config.endpoint + "/client", this.config.envType = this.config.envType || "public", this.adapter = ne;
    }
    async request(e2, t2 = true) {
      const n2 = t2;
      return e2 = n2 ? await this.setupLocalRequest(e2) : this.setupRequest(e2), Promise.resolve().then(() => n2 ? this.requestLocal(e2) : de.wrappedRequest(e2, this.adapter.request));
    }
    requestLocal(e2) {
      return new Promise((t2, n2) => {
        this.adapter.request(Object.assign(e2, { complete(e3) {
          if (e3 || (e3 = {}), !e3.statusCode || e3.statusCode >= 400) {
            const t3 = e3.data && e3.data.code || "SYS_ERR", s2 = e3.data && e3.data.message || "request:fail";
            return n2(new te({ code: t3, message: s2 }));
          }
          t2({ success: true, result: e3.data });
        } }));
      });
    }
    setupRequest(e2) {
      const t2 = Object.assign({}, e2, { spaceId: this.config.spaceId, timestamp: Date.now() }), n2 = { "Content-Type": "application/json" };
      n2["x-serverless-sign"] = de.sign(t2, this.config.clientSecret);
      const s2 = le();
      n2["x-client-info"] = encodeURIComponent(JSON.stringify(s2));
      const { token: r2 } = re();
      return n2["x-client-token"] = r2, { url: this.config.requestUrl, method: "POST", data: t2, dataType: "json", header: JSON.parse(JSON.stringify(n2)) };
    }
    async setupLocalRequest(e2) {
      const t2 = le(), { token: n2 } = re(), s2 = Object.assign({}, e2, { spaceId: this.config.spaceId, timestamp: Date.now(), clientInfo: t2, token: n2 }), { address: r2, servePort: i2 } = this.__dev__ && this.__dev__.debugInfo || {}, { address: o2 } = await Ot(r2, i2);
      return { url: `http://${o2}:${i2}/${xt[e2.method]}`, method: "POST", data: s2, dataType: "json", header: JSON.parse(JSON.stringify({ "Content-Type": "application/json" })) };
    }
    callFunction(e2) {
      const t2 = { method: "serverless.function.runtime.invoke", params: JSON.stringify({ functionTarget: e2.name, functionArgs: e2.data || {} }) };
      return this.request(t2, false);
    }
    getUploadFileOptions(e2) {
      const t2 = { method: "serverless.file.resource.generateProximalSign", params: JSON.stringify(e2) };
      return this.request(t2);
    }
    reportUploadFile(e2) {
      const t2 = { method: "serverless.file.resource.report", params: JSON.stringify(e2) };
      return this.request(t2);
    }
    uploadFile({ filePath: e2, cloudPath: t2, fileType: n2 = "image", onUploadProgress: s2 }) {
      if (!t2)
        throw new te({ code: "CLOUDPATH_REQUIRED", message: "cloudPath不可为空" });
      let r2;
      return this.getUploadFileOptions({ cloudPath: t2 }).then((t3) => {
        const { url: i2, formData: o2, name: a2 } = t3.result;
        return r2 = t3.result.fileUrl, new Promise((t4, r3) => {
          const c2 = this.adapter.uploadFile({ url: i2, formData: o2, name: a2, filePath: e2, fileType: n2, success(e3) {
            e3 && e3.statusCode < 400 ? t4(e3) : r3(new te({ code: "UPLOAD_FAILED", message: "文件上传失败" }));
          }, fail(e3) {
            r3(new te({ code: e3.code || "UPLOAD_FAILED", message: e3.message || e3.errMsg || "文件上传失败" }));
          } });
          "function" == typeof s2 && c2 && "function" == typeof c2.onProgressUpdate && c2.onProgressUpdate((e3) => {
            s2({ loaded: e3.totalBytesSent, total: e3.totalBytesExpectedToSend });
          });
        });
      }).then(() => this.reportUploadFile({ cloudPath: t2 })).then((t3) => new Promise((n3, s3) => {
        t3.success ? n3({ success: true, filePath: e2, fileID: r2 }) : s3(new te({ code: "UPLOAD_FAILED", message: "文件上传失败" }));
      }));
    }
    deleteFile({ fileList: e2 }) {
      const t2 = { method: "serverless.file.resource.delete", params: JSON.stringify({ fileList: e2 }) };
      return this.request(t2).then((e3) => {
        if (e3.success)
          return e3.result;
        throw new te({ code: "DELETE_FILE_FAILED", message: "删除文件失败" });
      });
    }
    getTempFileURL({ fileList: e2, maxAge: t2 } = {}) {
      if (!Array.isArray(e2) || 0 === e2.length)
        throw new te({ code: "INVALID_PARAM", message: "fileList的元素必须是非空的字符串" });
      const n2 = { method: "serverless.file.resource.getTempFileURL", params: JSON.stringify({ fileList: e2, maxAge: t2 }) };
      return this.request(n2).then((e3) => {
        if (e3.success)
          return { fileList: e3.result.fileList.map((e4) => ({ fileID: e4.fileID, tempFileURL: e4.tempFileURL })) };
        throw new te({ code: "GET_TEMP_FILE_URL_FAILED", message: "获取临时文件链接失败" });
      });
    }
  };
  var Rt = { init(e2) {
    const t2 = new Nt(e2), n2 = { signInAnonymously: function() {
      return Promise.resolve();
    }, getLoginState: function() {
      return Promise.resolve(false);
    } };
    return t2.auth = function() {
      return n2;
    }, t2.customAuth = t2.auth, t2;
  } }, Lt = n(function(e2, t2) {
    e2.exports = r.enc.Hex;
  });
  function Ut() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(e2) {
      var t2 = 16 * Math.random() | 0;
      return ("x" === e2 ? t2 : 3 & t2 | 8).toString(16);
    });
  }
  function Dt(e2 = "", t2 = {}) {
    const { data: n2, functionName: s2, method: r2, headers: i2, signHeaderKeys: o2 = [], config: a2 } = t2, c2 = String(Date.now()), u2 = Ut(), h2 = Object.assign({}, i2, { "x-from-app-id": a2.spaceAppId, "x-from-env-id": a2.spaceId, "x-to-env-id": a2.spaceId, "x-from-instance-id": c2, "x-from-function-name": s2, "x-client-timestamp": c2, "x-alipay-source": "client", "x-request-id": u2, "x-alipay-callid": u2, "x-trace-id": u2 }), l2 = ["x-from-app-id", "x-from-env-id", "x-to-env-id", "x-from-instance-id", "x-from-function-name", "x-client-timestamp"].concat(o2), [d2 = "", p2 = ""] = e2.split("?") || [], f2 = function(e3) {
      const t3 = "HMAC-SHA256", n3 = e3.signedHeaders.join(";"), s3 = e3.signedHeaders.map((t4) => `${t4.toLowerCase()}:${e3.headers[t4]}
`).join(""), r3 = we(e3.body).toString(Lt), i3 = `${e3.method.toUpperCase()}
${e3.path}
${e3.query}
${s3}
${n3}
${r3}
`, o3 = we(i3).toString(Lt), a3 = `${t3}
${e3.timestamp}
${o3}
`, c3 = Ie(a3, e3.secretKey).toString(Lt);
      return `${t3} Credential=${e3.secretId}, SignedHeaders=${n3}, Signature=${c3}`;
    }({ path: d2, query: p2, method: r2, headers: h2, timestamp: c2, body: JSON.stringify(n2), secretId: a2.accessKey, secretKey: a2.secretKey, signedHeaders: l2.sort() });
    return { url: `${a2.endpoint}${e2}`, headers: Object.assign({}, h2, { Authorization: f2 }) };
  }
  function Mt({ url: e2, data: t2, method: n2 = "POST", headers: s2 = {}, timeout: r2 }) {
    return new Promise((i2, o2) => {
      ne.request({ url: e2, method: n2, data: "object" == typeof t2 ? JSON.stringify(t2) : t2, header: s2, dataType: "json", timeout: r2, complete: (e3 = {}) => {
        const t3 = s2["x-trace-id"] || "";
        if (!e3.statusCode || e3.statusCode >= 400) {
          const { message: n3, errMsg: s3, trace_id: r3 } = e3.data || {};
          return o2(new te({ code: "SYS_ERR", message: n3 || s3 || "request:fail", requestId: r3 || t3 }));
        }
        i2({ status: e3.statusCode, data: e3.data, headers: e3.header, requestId: t3 });
      } });
    });
  }
  function qt(e2, t2) {
    const { path: n2, data: s2, method: r2 = "GET" } = e2, { url: i2, headers: o2 } = Dt(n2, { functionName: "", data: s2, method: r2, headers: { "x-alipay-cloud-mode": "oss", "x-data-api-type": "oss", "x-expire-timestamp": String(Date.now() + 6e4) }, signHeaderKeys: ["x-data-api-type", "x-expire-timestamp"], config: t2 });
    return Mt({ url: i2, data: s2, method: r2, headers: o2 }).then((e3) => {
      const t3 = e3.data || {};
      if (!t3.success)
        throw new te({ code: e3.errCode, message: e3.errMsg, requestId: e3.requestId });
      return t3.data || {};
    }).catch((e3) => {
      throw new te({ code: e3.errCode, message: e3.errMsg, requestId: e3.requestId });
    });
  }
  function Ft(e2 = "") {
    const t2 = e2.trim().replace(/^cloud:\/\//, ""), n2 = t2.indexOf("/");
    if (n2 <= 0)
      throw new te({ code: "INVALID_PARAM", message: "fileID不合法" });
    const s2 = t2.substring(0, n2), r2 = t2.substring(n2 + 1);
    return s2 !== this.config.spaceId && console.warn("file ".concat(e2, " does not belong to env ").concat(this.config.spaceId)), r2;
  }
  function Kt(e2 = "") {
    return "cloud://".concat(this.config.spaceId, "/").concat(e2.replace(/^\/+/, ""));
  }
  class jt {
    constructor(e2) {
      this.config = e2;
    }
    signedURL(e2, t2 = {}) {
      const n2 = `/ws/function/${e2}`, s2 = this.config.wsEndpoint.replace(/^ws(s)?:\/\//, ""), r2 = Object.assign({}, t2, { accessKeyId: this.config.accessKey, signatureNonce: Ut(), timestamp: "" + Date.now() }), i2 = [n2, ["accessKeyId", "authorization", "signatureNonce", "timestamp"].sort().map(function(e3) {
        return r2[e3] ? "".concat(e3, "=").concat(r2[e3]) : null;
      }).filter(Boolean).join("&"), `host:${s2}`].join("\n"), o2 = ["HMAC-SHA256", we(i2).toString(Lt)].join("\n"), a2 = Ie(o2, this.config.secretKey).toString(Lt), c2 = Object.keys(r2).map((e3) => `${e3}=${encodeURIComponent(r2[e3])}`).join("&");
      return `${this.config.wsEndpoint}${n2}?${c2}&signature=${a2}`;
    }
  }
  var $t = class {
    constructor(e2) {
      if (["spaceId", "spaceAppId", "accessKey", "secretKey"].forEach((t2) => {
        if (!Object.prototype.hasOwnProperty.call(e2, t2))
          throw new Error(`${t2} required`);
      }), e2.endpoint) {
        if ("string" != typeof e2.endpoint)
          throw new Error("endpoint must be string");
        if (!/^https:\/\//.test(e2.endpoint))
          throw new Error("endpoint must start with https://");
        e2.endpoint = e2.endpoint.replace(/\/$/, "");
      }
      this.config = Object.assign({}, e2, { endpoint: e2.endpoint || `https://${e2.spaceId}.api-hz.cloudbasefunction.cn`, wsEndpoint: e2.wsEndpoint || `wss://${e2.spaceId}.api-hz.cloudbasefunction.cn` }), this._websocket = new jt(this.config);
    }
    callFunction(e2) {
      return function(e3, t2) {
        const { name: n2, data: s2, async: r2 = false, timeout: i2 } = e3, o2 = "POST", a2 = { "x-to-function-name": n2 };
        r2 && (a2["x-function-invoke-type"] = "async");
        const { url: c2, headers: u2 } = Dt("/functions/invokeFunction", { functionName: n2, data: s2, method: o2, headers: a2, signHeaderKeys: ["x-to-function-name"], config: t2 });
        return Mt({ url: c2, data: s2, method: o2, headers: u2, timeout: i2 }).then((e4) => {
          let t3 = 0;
          if (r2) {
            const n3 = e4.data || {};
            t3 = "200" === n3.errCode ? 0 : n3.errCode, e4.data = n3.data || {}, e4.errMsg = n3.errMsg;
          }
          if (0 !== t3)
            throw new te({ code: t3, message: e4.errMsg, requestId: e4.requestId });
          return { errCode: t3, success: 0 === t3, requestId: e4.requestId, result: e4.data };
        }).catch((e4) => {
          throw new te({ code: e4.errCode, message: e4.errMsg, requestId: e4.requestId });
        });
      }(e2, this.config);
    }
    uploadFileToOSS({ url: e2, filePath: t2, fileType: n2, formData: s2, onUploadProgress: r2 }) {
      return new Promise((i2, o2) => {
        const a2 = ne.uploadFile({ url: e2, filePath: t2, fileType: n2, formData: s2, name: "file", success(e3) {
          e3 && e3.statusCode < 400 ? i2(e3) : o2(new te({ code: "UPLOAD_FAILED", message: "文件上传失败" }));
        }, fail(e3) {
          o2(new te({ code: e3.code || "UPLOAD_FAILED", message: e3.message || e3.errMsg || "文件上传失败" }));
        } });
        "function" == typeof r2 && a2 && "function" == typeof a2.onProgressUpdate && a2.onProgressUpdate((e3) => {
          r2({ loaded: e3.totalBytesSent, total: e3.totalBytesExpectedToSend });
        });
      });
    }
    async uploadFile({ filePath: e2, cloudPath: t2 = "", fileType: n2 = "image", onUploadProgress: s2 }) {
      if ("string" !== g(t2))
        throw new te({ code: "INVALID_PARAM", message: "cloudPath必须为字符串类型" });
      if (!(t2 = t2.trim()))
        throw new te({ code: "INVALID_PARAM", message: "cloudPath不可为空" });
      if (/:\/\//.test(t2))
        throw new te({ code: "INVALID_PARAM", message: "cloudPath不合法" });
      const r2 = await qt({ path: "/".concat(t2.replace(/^\//, ""), "?post_url") }, this.config), { file_id: i2, upload_url: o2, form_data: a2 } = r2, c2 = a2 && a2.reduce((e3, t3) => (e3[t3.key] = t3.value, e3), {});
      return this.uploadFileToOSS({ url: o2, filePath: e2, fileType: n2, formData: c2, onUploadProgress: s2 }).then(() => ({ fileID: i2 }));
    }
    async getTempFileURL({ fileList: e2 }) {
      return new Promise((t2, n2) => {
        (!e2 || e2.length < 0) && t2({ code: "INVALID_PARAM", message: "fileList不能为空数组" }), e2.length > 50 && t2({ code: "INVALID_PARAM", message: "fileList数组长度不能超过50" });
        const s2 = [];
        for (const n3 of e2) {
          let e3;
          "string" !== g(n3) && t2({ code: "INVALID_PARAM", message: "fileList的元素必须是非空的字符串" });
          try {
            e3 = Ft.call(this, n3);
          } catch (t3) {
            console.warn(t3.errCode, t3.errMsg), e3 = n3;
          }
          s2.push({ file_id: e3, expire: 600 });
        }
        qt({ path: "/?download_url", data: { file_list: s2 }, method: "POST" }, this.config).then((e3) => {
          const { file_list: n3 = [] } = e3;
          t2({ fileList: n3.map((e4) => ({ fileID: Kt.call(this, e4.file_id), tempFileURL: e4.download_url })) });
        }).catch((e3) => n2(e3));
      });
    }
    async connectWebSocket(e2) {
      const { name: t2, query: n2 } = e2;
      return ne.connectSocket({ url: this._websocket.signedURL(t2, n2), complete: () => {
      } });
    }
  };
  var Bt = { init: (e2) => {
    e2.provider = "alipay";
    const t2 = new $t(e2);
    return t2.auth = function() {
      return { signInAnonymously: function() {
        return Promise.resolve();
      }, getLoginState: function() {
        return Promise.resolve(true);
      } };
    }, t2;
  } };
  function Wt({ data: e2 }) {
    let t2;
    t2 = le();
    const n2 = JSON.parse(JSON.stringify(e2 || {}));
    if (Object.assign(n2, { clientInfo: t2 }), !n2.uniIdToken) {
      const { token: e3 } = re();
      e3 && (n2.uniIdToken = e3);
    }
    return n2;
  }
  async function Ht(e2 = {}) {
    await this.__dev__.initLocalNetwork();
    const { localAddress: t2, localPort: n2 } = this.__dev__, s2 = { aliyun: "aliyun", tencent: "tcb", alipay: "alipay", dcloud: "dcloud" }[this.config.provider], r2 = this.config.spaceId, i2 = `http://${t2}:${n2}/system/check-function`, o2 = `http://${t2}:${n2}/cloudfunctions/${e2.name}`;
    return new Promise((t3, n3) => {
      ne.request({ method: "POST", url: i2, data: { name: e2.name, platform: P, provider: s2, spaceId: r2 }, timeout: 3e3, success(e3) {
        t3(e3);
      }, fail() {
        t3({ data: { code: "NETWORK_ERROR", message: "连接本地调试服务失败，请检查客户端是否和主机在同一局域网下，自动切换为已部署的云函数。" } });
      } });
    }).then(({ data: e3 } = {}) => {
      const { code: t3, message: n3 } = e3 || {};
      return { code: 0 === t3 ? 0 : t3 || "SYS_ERR", message: n3 || "SYS_ERR" };
    }).then(({ code: t3, message: n3 }) => {
      if (0 !== t3) {
        switch (t3) {
          case "MODULE_ENCRYPTED":
            console.error(`此云函数（${e2.name}）依赖加密公共模块不可本地调试，自动切换为云端已部署的云函数`);
            break;
          case "FUNCTION_ENCRYPTED":
            console.error(`此云函数（${e2.name}）已加密不可本地调试，自动切换为云端已部署的云函数`);
            break;
          case "ACTION_ENCRYPTED":
            console.error(n3 || "需要访问加密的uni-clientDB-action，自动切换为云端环境");
            break;
          case "NETWORK_ERROR":
            console.error(n3 || "连接本地调试服务失败，请检查客户端是否和主机在同一局域网下");
            break;
          case "SWITCH_TO_CLOUD":
            break;
          default: {
            const e3 = `检测本地调试服务出现错误：${n3}，请检查网络环境或重启客户端再试`;
            throw console.error(e3), new Error(e3);
          }
        }
        return this._callCloudFunction(e2);
      }
      return new Promise((t4, n4) => {
        const r3 = Wt.call(this, { data: e2.data });
        ne.request({ method: "POST", url: o2, data: { provider: s2, platform: P, param: r3 }, timeout: e2.timeout, success: ({ statusCode: e3, data: s3 } = {}) => !e3 || e3 >= 400 ? n4(new te({ code: s3.code || "SYS_ERR", message: s3.message || "request:fail" })) : t4({ result: s3 }), fail(e3) {
          n4(new te({ code: e3.code || e3.errCode || "SYS_ERR", message: e3.message || e3.errMsg || "request:fail" }));
        } });
      });
    });
  }
  const Jt = [{ rule: /fc_function_not_found|FUNCTION_NOT_FOUND/, content: "，云函数[{functionName}]在云端不存在，请检查此云函数名称是否正确以及该云函数是否已上传到服务空间", mode: "append" }];
  var zt = /[\\^$.*+?()[\]{}|]/g, Vt = RegExp(zt.source);
  function Gt(e2, t2, n2) {
    return e2.replace(new RegExp((s2 = t2) && Vt.test(s2) ? s2.replace(zt, "\\$&") : s2, "g"), n2);
    var s2;
  }
  const Yt = { NONE: "none", REQUEST: "request", RESPONSE: "response", BOTH: "both" }, Qt = "_globalUniCloudStatus", Xt = "_globalUniCloudSecureNetworkCache__{spaceId}", Zt = "uni-secure-network", en = { SYSTEM_ERROR: { code: 2e4, message: "System error" }, APP_INFO_INVALID: { code: 20101, message: "Invalid client" }, GET_ENCRYPT_KEY_FAILED: { code: 20102, message: "Get encrypt key failed" } };
  function nn(e2) {
    const { errSubject: t2, subject: n2, errCode: s2, errMsg: r2, code: i2, message: o2, cause: a2 } = e2 || {};
    return new te({ subject: t2 || n2 || Zt, code: s2 || i2 || en.SYSTEM_ERROR.code, message: r2 || o2, cause: a2 });
  }
  let Kn;
  function Hn({ secretType: e2 } = {}) {
    return e2 === Yt.REQUEST || e2 === Yt.RESPONSE || e2 === Yt.BOTH;
  }
  function Jn({ name: e2, data: t2 = {} } = {}) {
    return "DCloud-clientDB" === e2 && "encryption" === t2.redirectTo && "getAppClientKey" === t2.action;
  }
  function zn({ provider: e2, spaceId: t2, functionName: n2 } = {}) {
    const { appId: s2, uniPlatform: r2, osName: i2 } = ce();
    let o2 = r2;
    "app" === r2 && (o2 = i2);
    const a2 = function({ provider: e3, spaceId: t3 } = {}) {
      const n3 = A;
      if (!n3)
        return {};
      e3 = /* @__PURE__ */ function(e4) {
        return "tencent" === e4 ? "tcb" : e4;
      }(e3);
      const s3 = n3.find((n4) => n4.provider === e3 && n4.spaceId === t3);
      return s3 && s3.config;
    }({ provider: e2, spaceId: t2 });
    if (!a2 || !a2.accessControl || !a2.accessControl.enable)
      return false;
    const c2 = a2.accessControl.function || {}, u2 = Object.keys(c2);
    if (0 === u2.length)
      return true;
    const h2 = function(e3, t3) {
      let n3, s3, r3;
      for (let i3 = 0; i3 < e3.length; i3++) {
        const o3 = e3[i3];
        o3 !== t3 ? "*" !== o3 ? o3.split(",").map((e4) => e4.trim()).indexOf(t3) > -1 && (s3 = o3) : r3 = o3 : n3 = o3;
      }
      return n3 || s3 || r3;
    }(u2, n2);
    if (!h2)
      return false;
    if ((c2[h2] || []).find((e3 = {}) => e3.appId === s2 && (e3.platform || "").toLowerCase() === o2.toLowerCase()))
      return true;
    throw console.error(`此应用[appId: ${s2}, platform: ${o2}]不在云端配置的允许访问的应用列表内，参考：https://uniapp.dcloud.net.cn/uniCloud/secure-network.html#verify-client`), nn(en.APP_INFO_INVALID);
  }
  function Vn({ functionName: e2, result: t2, logPvd: n2 }) {
    if (this.__dev__.debugLog && t2 && t2.requestId) {
      const s2 = JSON.stringify({ spaceId: this.config.spaceId, functionName: e2, requestId: t2.requestId });
      console.log(`[${n2}-request]${s2}[/${n2}-request]`);
    }
  }
  function Gn(e2) {
    const t2 = e2.callFunction, n2 = function(n3) {
      const s2 = n3.name;
      n3.data = Wt.call(e2, { data: n3.data });
      const r2 = { aliyun: "aliyun", tencent: "tcb", tcb: "tcb", alipay: "alipay", dcloud: "dcloud" }[this.config.provider], i2 = Hn(n3), o2 = Jn(n3), a2 = i2 || o2;
      return t2.call(this, n3).then((e3) => (e3.errCode = 0, !a2 && Vn.call(this, { functionName: s2, result: e3, logPvd: r2 }), Promise.resolve(e3)), (e3) => (!a2 && Vn.call(this, { functionName: s2, result: e3, logPvd: r2 }), e3 && e3.message && (e3.message = function({ message: e4 = "", extraInfo: t3 = {}, formatter: n4 = [] } = {}) {
        for (let s3 = 0; s3 < n4.length; s3++) {
          const { rule: r3, content: i3, mode: o3 } = n4[s3], a3 = e4.match(r3);
          if (!a3)
            continue;
          let c2 = i3;
          for (let e5 = 1; e5 < a3.length; e5++)
            c2 = Gt(c2, `{$${e5}}`, a3[e5]);
          for (const e5 in t3)
            c2 = Gt(c2, `{${e5}}`, t3[e5]);
          return "replace" === o3 ? c2 : e4 + c2;
        }
        return e4;
      }({ message: `[${n3.name}]: ${e3.message}`, formatter: Jt, extraInfo: { functionName: s2 } })), Promise.reject(e3)));
    };
    e2.callFunction = function(t3) {
      const { provider: s2, spaceId: r2 } = e2.config, i2 = t3.name;
      let o2, a2;
      if (t3.data = t3.data || {}, e2.__dev__.debugInfo && !e2.__dev__.debugInfo.forceRemote && O ? (e2._callCloudFunction || (e2._callCloudFunction = n2, e2._callLocalFunction = Ht), o2 = Ht) : o2 = n2, o2 = o2.bind(e2), Jn(t3))
        a2 = n2.call(e2, t3);
      else if (Hn(t3)) {
        a2 = new Kn({ secretType: t3.secretType, uniCloudIns: e2 }).wrapEncryptDataCallFunction(n2.bind(e2))(t3);
      } else if (zn({ provider: s2, spaceId: r2, functionName: i2 })) {
        a2 = new Kn({ secretType: t3.secretType, uniCloudIns: e2 }).wrapVerifyClientCallFunction(n2.bind(e2))(t3);
      } else
        a2 = o2(t3);
      return Object.defineProperty(a2, "result", { get: () => (console.warn("当前返回结果为Promise类型，不可直接访问其result属性，详情请参考：https://uniapp.dcloud.net.cn/uniCloud/faq?id=promise"), {}) }), a2.then((e3) => e3);
    };
  }
  Kn = class {
    constructor() {
      throw nn({ message: `Platform ${P} is not enabled, please check whether secure network module is enabled in your manifest.json` });
    }
  };
  const Yn = Symbol("CLIENT_DB_INTERNAL");
  function Qn(e2, t2) {
    return e2.then = "DoNotReturnProxyWithAFunctionNamedThen", e2._internalType = Yn, e2.inspect = null, e2.__v_raw = void 0, new Proxy(e2, { get(e3, n2, s2) {
      if ("_uniClient" === n2)
        return null;
      if ("symbol" == typeof n2)
        return e3[n2];
      if (n2 in e3 || "string" != typeof n2) {
        const t3 = e3[n2];
        return "function" == typeof t3 ? t3.bind(e3) : t3;
      }
      return t2.get(e3, n2, s2);
    } });
  }
  function Xn(e2) {
    return { on: (t2, n2) => {
      e2[t2] = e2[t2] || [], e2[t2].indexOf(n2) > -1 || e2[t2].push(n2);
    }, off: (t2, n2) => {
      e2[t2] = e2[t2] || [];
      const s2 = e2[t2].indexOf(n2);
      -1 !== s2 && e2[t2].splice(s2, 1);
    } };
  }
  const Zn = ["db.Geo", "db.command", "command.aggregate"];
  function es(e2, t2) {
    return Zn.indexOf(`${e2}.${t2}`) > -1;
  }
  function ts(e2) {
    switch (g(e2 = se(e2))) {
      case "array":
        return e2.map((e3) => ts(e3));
      case "object":
        return e2._internalType === Yn || Object.keys(e2).forEach((t2) => {
          e2[t2] = ts(e2[t2]);
        }), e2;
      case "regexp":
        return { $regexp: { source: e2.source, flags: e2.flags } };
      case "date":
        return { $date: e2.toISOString() };
      default:
        return e2;
    }
  }
  function ns(e2) {
    return e2 && e2.content && e2.content.$method;
  }
  class ss {
    constructor(e2, t2, n2) {
      this.content = e2, this.prevStage = t2 || null, this.udb = null, this._database = n2;
    }
    toJSON() {
      let e2 = this;
      const t2 = [e2.content];
      for (; e2.prevStage; )
        e2 = e2.prevStage, t2.push(e2.content);
      return { $db: t2.reverse().map((e3) => ({ $method: e3.$method, $param: ts(e3.$param) })) };
    }
    toString() {
      return JSON.stringify(this.toJSON());
    }
    getAction() {
      const e2 = this.toJSON().$db.find((e3) => "action" === e3.$method);
      return e2 && e2.$param && e2.$param[0];
    }
    getCommand() {
      return { $db: this.toJSON().$db.filter((e2) => "action" !== e2.$method) };
    }
    get isAggregate() {
      let e2 = this;
      for (; e2; ) {
        const t2 = ns(e2), n2 = ns(e2.prevStage);
        if ("aggregate" === t2 && "collection" === n2 || "pipeline" === t2)
          return true;
        e2 = e2.prevStage;
      }
      return false;
    }
    get isCommand() {
      let e2 = this;
      for (; e2; ) {
        if ("command" === ns(e2))
          return true;
        e2 = e2.prevStage;
      }
      return false;
    }
    get isAggregateCommand() {
      let e2 = this;
      for (; e2; ) {
        const t2 = ns(e2), n2 = ns(e2.prevStage);
        if ("aggregate" === t2 && "command" === n2)
          return true;
        e2 = e2.prevStage;
      }
      return false;
    }
    getNextStageFn(e2) {
      const t2 = this;
      return function() {
        return rs({ $method: e2, $param: ts(Array.from(arguments)) }, t2, t2._database);
      };
    }
    get count() {
      return this.isAggregate ? this.getNextStageFn("count") : function() {
        return this._send("count", Array.from(arguments));
      };
    }
    get remove() {
      return this.isCommand ? this.getNextStageFn("remove") : function() {
        return this._send("remove", Array.from(arguments));
      };
    }
    get() {
      return this._send("get", Array.from(arguments));
    }
    get add() {
      return this.isCommand ? this.getNextStageFn("add") : function() {
        return this._send("add", Array.from(arguments));
      };
    }
    update() {
      return this._send("update", Array.from(arguments));
    }
    end() {
      return this._send("end", Array.from(arguments));
    }
    get set() {
      return this.isCommand ? this.getNextStageFn("set") : function() {
        throw new Error("JQL禁止使用set方法");
      };
    }
    _send(e2, t2) {
      const n2 = this.getAction(), s2 = this.getCommand();
      if (s2.$db.push({ $method: e2, $param: ts(t2) }), b) {
        const e3 = s2.$db.find((e4) => "collection" === e4.$method), t3 = e3 && e3.$param;
        t3 && 1 === t3.length && "string" == typeof e3.$param[0] && e3.$param[0].indexOf(",") > -1 && console.warn("检测到使用JQL语法联表查询时，未使用getTemp先过滤主表数据，在主表数据量大的情况下可能会查询缓慢。\n- 如何优化请参考此文档：https://uniapp.dcloud.net.cn/uniCloud/jql?id=lookup-with-temp \n- 如果主表数据量很小请忽略此信息，项目发行时不会出现此提示。");
      }
      return this._database._callCloudFunction({ action: n2, command: s2 });
    }
  }
  function rs(e2, t2, n2) {
    return Qn(new ss(e2, t2, n2), { get(e3, t3) {
      let s2 = "db";
      return e3 && e3.content && (s2 = e3.content.$method), es(s2, t3) ? rs({ $method: t3 }, e3, n2) : function() {
        return rs({ $method: t3, $param: ts(Array.from(arguments)) }, e3, n2);
      };
    } });
  }
  function is({ path: e2, method: t2 }) {
    return class {
      constructor() {
        this.param = Array.from(arguments);
      }
      toJSON() {
        return { $newDb: [...e2.map((e3) => ({ $method: e3 })), { $method: t2, $param: this.param }] };
      }
      toString() {
        return JSON.stringify(this.toJSON());
      }
    };
  }
  class os {
    constructor({ uniClient: e2 = {}, isJQL: t2 = false } = {}) {
      this._uniClient = e2, this._authCallBacks = {}, this._dbCallBacks = {}, e2._isDefault && (this._dbCallBacks = U("_globalUniCloudDatabaseCallback")), t2 || (this.auth = Xn(this._authCallBacks)), this._isJQL = t2, Object.assign(this, Xn(this._dbCallBacks)), this.env = Qn({}, { get: (e3, t3) => ({ $env: t3 }) }), this.Geo = Qn({}, { get: (e3, t3) => is({ path: ["Geo"], method: t3 }) }), this.serverDate = is({ path: [], method: "serverDate" }), this.RegExp = is({ path: [], method: "RegExp" });
    }
    getCloudEnv(e2) {
      if ("string" != typeof e2 || !e2.trim())
        throw new Error("getCloudEnv参数错误");
      return { $env: e2.replace("$cloudEnv_", "") };
    }
    _callback(e2, t2) {
      const n2 = this._dbCallBacks;
      n2[e2] && n2[e2].forEach((e3) => {
        e3(...t2);
      });
    }
    _callbackAuth(e2, t2) {
      const n2 = this._authCallBacks;
      n2[e2] && n2[e2].forEach((e3) => {
        e3(...t2);
      });
    }
    multiSend() {
      const e2 = Array.from(arguments), t2 = e2.map((e3) => {
        const t3 = e3.getAction(), n2 = e3.getCommand();
        if ("getTemp" !== n2.$db[n2.$db.length - 1].$method)
          throw new Error("multiSend只支持子命令内使用getTemp");
        return { action: t3, command: n2 };
      });
      return this._callCloudFunction({ multiCommand: t2, queryList: e2 });
    }
  }
  function as(e2, t2 = {}) {
    return Qn(new e2(t2), { get: (e3, t3) => es("db", t3) ? rs({ $method: t3 }, null, e3) : function() {
      return rs({ $method: t3, $param: ts(Array.from(arguments)) }, null, e3);
    } });
  }
  class cs extends os {
    _parseResult(e2) {
      return this._isJQL ? e2.result : e2;
    }
    _callCloudFunction({ action: e2, command: t2, multiCommand: n2, queryList: s2 }) {
      function r2(e3, t3) {
        if (n2 && s2)
          for (let n3 = 0; n3 < s2.length; n3++) {
            const r3 = s2[n3];
            r3.udb && "function" == typeof r3.udb.setResult && (t3 ? r3.udb.setResult(t3) : r3.udb.setResult(e3.result.dataList[n3]));
          }
      }
      const i2 = this, o2 = this._isJQL ? "databaseForJQL" : "database";
      function a2(e3) {
        return i2._callback("error", [e3]), j($(o2, "fail"), e3).then(() => j($(o2, "complete"), e3)).then(() => (r2(null, e3), Y(H.RESPONSE, { type: J.CLIENT_DB, content: e3 }), Promise.reject(e3)));
      }
      const c2 = j($(o2, "invoke")), u2 = this._uniClient;
      return c2.then(() => u2.callFunction({ name: "DCloud-clientDB", type: l.CLIENT_DB, data: { action: e2, command: t2, multiCommand: n2 } })).then((e3) => {
        const { code: t3, message: n3, token: s3, tokenExpired: c3, systemInfo: u3 = [] } = e3.result;
        if (u3)
          for (let e4 = 0; e4 < u3.length; e4++) {
            const { level: t4, message: n4, detail: s4 } = u3[e4];
            let r3 = "[System Info]" + n4;
            s4 && (r3 = `${r3}
详细信息：${s4}`), (console["warn" === t4 ? "error" : t4] || console.log)(r3);
          }
        if (t3) {
          return a2(new te({ code: t3, message: n3, requestId: e3.requestId }));
        }
        e3.result.errCode = e3.result.errCode || e3.result.code, e3.result.errMsg = e3.result.errMsg || e3.result.message, s3 && c3 && (ie({ token: s3, tokenExpired: c3 }), this._callbackAuth("refreshToken", [{ token: s3, tokenExpired: c3 }]), this._callback("refreshToken", [{ token: s3, tokenExpired: c3 }]), Y(H.REFRESH_TOKEN, { token: s3, tokenExpired: c3 }));
        const h2 = [{ prop: "affectedDocs", tips: "affectedDocs不再推荐使用，请使用inserted/deleted/updated/data.length替代" }, { prop: "code", tips: "code不再推荐使用，请使用errCode替代" }, { prop: "message", tips: "message不再推荐使用，请使用errMsg替代" }];
        for (let t4 = 0; t4 < h2.length; t4++) {
          const { prop: n4, tips: s4 } = h2[t4];
          if (n4 in e3.result) {
            const t5 = e3.result[n4];
            Object.defineProperty(e3.result, n4, { get: () => (console.warn(s4), t5) });
          }
        }
        return function(e4) {
          return j($(o2, "success"), e4).then(() => j($(o2, "complete"), e4)).then(() => {
            r2(e4, null);
            const t4 = i2._parseResult(e4);
            return Y(H.RESPONSE, { type: J.CLIENT_DB, content: t4 }), Promise.resolve(t4);
          });
        }(e3);
      }, (e3) => {
        /fc_function_not_found|FUNCTION_NOT_FOUND/g.test(e3.message) && console.warn("clientDB未初始化，请在web控制台保存一次schema以开启clientDB");
        return a2(new te({ code: e3.code || "SYSTEM_ERROR", message: e3.message, requestId: e3.requestId }));
      });
    }
  }
  const us = "token无效，跳转登录页面", hs = "token过期，跳转登录页面", ls = { TOKEN_INVALID_TOKEN_EXPIRED: hs, TOKEN_INVALID_INVALID_CLIENTID: us, TOKEN_INVALID: us, TOKEN_INVALID_WRONG_TOKEN: us, TOKEN_INVALID_ANONYMOUS_USER: us }, ds = { "uni-id-token-expired": hs, "uni-id-check-token-failed": us, "uni-id-token-not-exist": us, "uni-id-check-device-feature-failed": us }, ps = { ...ls, ...ds, default: "用户未登录或登录状态过期，自动跳转登录页面" };
  function fs(e2, t2) {
    let n2 = "";
    return n2 = e2 ? `${e2}/${t2}` : t2, n2.replace(/^\//, "");
  }
  function gs(e2 = [], t2 = "") {
    const n2 = [], s2 = [];
    return e2.forEach((e3) => {
      true === e3.needLogin ? n2.push(fs(t2, e3.path)) : false === e3.needLogin && s2.push(fs(t2, e3.path));
    }), { needLoginPage: n2, notNeedLoginPage: s2 };
  }
  function ms(e2) {
    return e2.split("?")[0].replace(/^\//, "");
  }
  function ys() {
    return function(e2) {
      let t2 = e2 && e2.$page && e2.$page.fullPath;
      return t2 ? ("/" !== t2.charAt(0) && (t2 = "/" + t2), t2) : "";
    }(function() {
      const e2 = getCurrentPages();
      return e2[e2.length - 1];
    }());
  }
  function _s() {
    return ms(ys());
  }
  function ws(e2 = "", t2 = {}) {
    if (!e2)
      return false;
    if (!(t2 && t2.list && t2.list.length))
      return false;
    const n2 = t2.list, s2 = ms(e2);
    return n2.some((e3) => e3.pagePath === s2);
  }
  const Is = !!e.uniIdRouter;
  const { loginPage: vs, routerNeedLogin: Ss, resToLogin: Ts, needLoginPage: bs, notNeedLoginPage: Es, loginPageInTabBar: ks } = function({ pages: t2 = [], subPackages: n2 = [], uniIdRouter: s2 = {}, tabBar: r2 = {} } = e) {
    const { loginPage: i2, needLogin: o2 = [], resToLogin: a2 = true } = s2, { needLoginPage: c2, notNeedLoginPage: u2 } = gs(t2), { needLoginPage: h2, notNeedLoginPage: l2 } = function(e2 = []) {
      const t3 = [], n3 = [];
      return e2.forEach((e3) => {
        const { root: s3, pages: r3 = [] } = e3, { needLoginPage: i3, notNeedLoginPage: o3 } = gs(r3, s3);
        t3.push(...i3), n3.push(...o3);
      }), { needLoginPage: t3, notNeedLoginPage: n3 };
    }(n2);
    return { loginPage: i2, routerNeedLogin: o2, resToLogin: a2, needLoginPage: [...c2, ...h2], notNeedLoginPage: [...u2, ...l2], loginPageInTabBar: ws(i2, r2) };
  }();
  if (bs.indexOf(vs) > -1)
    throw new Error(`Login page [${vs}] should not be "needLogin", please check your pages.json`);
  function As(e2) {
    const t2 = _s();
    if ("/" === e2.charAt(0))
      return e2;
    const [n2, s2] = e2.split("?"), r2 = n2.replace(/^\//, "").split("/"), i2 = t2.split("/");
    i2.pop();
    for (let e3 = 0; e3 < r2.length; e3++) {
      const t3 = r2[e3];
      ".." === t3 ? i2.pop() : "." !== t3 && i2.push(t3);
    }
    return "" === i2[0] && i2.shift(), "/" + i2.join("/") + (s2 ? "?" + s2 : "");
  }
  function Ps(e2) {
    const t2 = ms(As(e2));
    return !(Es.indexOf(t2) > -1) && (bs.indexOf(t2) > -1 || Ss.some((t3) => function(e3, t4) {
      return new RegExp(t4).test(e3);
    }(e2, t3)));
  }
  function Cs({ redirect: e2 }) {
    const t2 = ms(e2), n2 = ms(vs);
    return _s() !== n2 && t2 !== n2;
  }
  function Os({ api: e2, redirect: t2 } = {}) {
    if (!t2 || !Cs({ redirect: t2 }))
      return;
    const n2 = function(e3, t3) {
      return "/" !== e3.charAt(0) && (e3 = "/" + e3), t3 ? e3.indexOf("?") > -1 ? e3 + `&uniIdRedirectUrl=${encodeURIComponent(t3)}` : e3 + `?uniIdRedirectUrl=${encodeURIComponent(t3)}` : e3;
    }(vs, t2);
    ks ? "navigateTo" !== e2 && "redirectTo" !== e2 || (e2 = "switchTab") : "switchTab" === e2 && (e2 = "navigateTo");
    const s2 = { navigateTo: uni.navigateTo, redirectTo: uni.redirectTo, switchTab: uni.switchTab, reLaunch: uni.reLaunch };
    setTimeout(() => {
      s2[e2]({ url: n2 });
    }, 0);
  }
  function xs({ url: e2 } = {}) {
    const t2 = { abortLoginPageJump: false, autoToLoginPage: false }, n2 = function() {
      const { token: e3, tokenExpired: t3 } = re();
      let n3;
      if (e3) {
        if (t3 < Date.now()) {
          const e4 = "uni-id-token-expired";
          n3 = { errCode: e4, errMsg: ps[e4] };
        }
      } else {
        const e4 = "uni-id-check-token-failed";
        n3 = { errCode: e4, errMsg: ps[e4] };
      }
      return n3;
    }();
    if (Ps(e2) && n2) {
      n2.uniIdRedirectUrl = e2;
      if (z(H.NEED_LOGIN).length > 0)
        return setTimeout(() => {
          Y(H.NEED_LOGIN, n2);
        }, 0), t2.abortLoginPageJump = true, t2;
      t2.autoToLoginPage = true;
    }
    return t2;
  }
  function Ns() {
    !function() {
      const e3 = ys(), { abortLoginPageJump: t2, autoToLoginPage: n2 } = xs({ url: e3 });
      t2 || n2 && Os({ api: "redirectTo", redirect: e3 });
    }();
    const e2 = ["navigateTo", "redirectTo", "reLaunch", "switchTab"];
    for (let t2 = 0; t2 < e2.length; t2++) {
      const n2 = e2[t2];
      uni.addInterceptor(n2, { invoke(e3) {
        const { abortLoginPageJump: t3, autoToLoginPage: s2 } = xs({ url: e3.url });
        return t3 ? e3 : s2 ? (Os({ api: n2, redirect: As(e3.url) }), false) : e3;
      } });
    }
  }
  function Rs() {
    this.onResponse((e2) => {
      const { type: t2, content: n2 } = e2;
      let s2 = false;
      switch (t2) {
        case "cloudobject":
          s2 = function(e3) {
            if ("object" != typeof e3)
              return false;
            const { errCode: t3 } = e3 || {};
            return t3 in ps;
          }(n2);
          break;
        case "clientdb":
          s2 = function(e3) {
            if ("object" != typeof e3)
              return false;
            const { errCode: t3 } = e3 || {};
            return t3 in ls;
          }(n2);
      }
      s2 && function(e3 = {}) {
        const t3 = z(H.NEED_LOGIN);
        Z().then(() => {
          const n3 = ys();
          if (n3 && Cs({ redirect: n3 }))
            return t3.length > 0 ? Y(H.NEED_LOGIN, Object.assign({ uniIdRedirectUrl: n3 }, e3)) : void (vs && Os({ api: "navigateTo", redirect: n3 }));
        });
      }(n2);
    });
  }
  function Ls(e2) {
    !function(e3) {
      e3.onResponse = function(e4) {
        V(H.RESPONSE, e4);
      }, e3.offResponse = function(e4) {
        G(H.RESPONSE, e4);
      };
    }(e2), function(e3) {
      e3.onNeedLogin = function(e4) {
        V(H.NEED_LOGIN, e4);
      }, e3.offNeedLogin = function(e4) {
        G(H.NEED_LOGIN, e4);
      }, Is && (U(Qt).needLoginInit || (U(Qt).needLoginInit = true, Z().then(() => {
        Ns.call(e3);
      }), Ts && Rs.call(e3)));
    }(e2), function(e3) {
      e3.onRefreshToken = function(e4) {
        V(H.REFRESH_TOKEN, e4);
      }, e3.offRefreshToken = function(e4) {
        G(H.REFRESH_TOKEN, e4);
      };
    }(e2);
  }
  let Us;
  const Ds = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", Ms = /^(?:[A-Za-z\d+/]{4})*?(?:[A-Za-z\d+/]{2}(?:==)?|[A-Za-z\d+/]{3}=?)?$/;
  function qs() {
    const e2 = re().token || "", t2 = e2.split(".");
    if (!e2 || 3 !== t2.length)
      return { uid: null, role: [], permission: [], tokenExpired: 0 };
    let n2;
    try {
      n2 = JSON.parse((s2 = t2[1], decodeURIComponent(Us(s2).split("").map(function(e3) {
        return "%" + ("00" + e3.charCodeAt(0).toString(16)).slice(-2);
      }).join(""))));
    } catch (e3) {
      throw new Error("获取当前用户信息出错，详细错误信息为：" + e3.message);
    }
    var s2;
    return n2.tokenExpired = 1e3 * n2.exp, delete n2.exp, delete n2.iat, n2;
  }
  Us = "function" != typeof atob ? function(e2) {
    if (e2 = String(e2).replace(/[\t\n\f\r ]+/g, ""), !Ms.test(e2))
      throw new Error("Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.");
    var t2;
    e2 += "==".slice(2 - (3 & e2.length));
    for (var n2, s2, r2 = "", i2 = 0; i2 < e2.length; )
      t2 = Ds.indexOf(e2.charAt(i2++)) << 18 | Ds.indexOf(e2.charAt(i2++)) << 12 | (n2 = Ds.indexOf(e2.charAt(i2++))) << 6 | (s2 = Ds.indexOf(e2.charAt(i2++))), r2 += 64 === n2 ? String.fromCharCode(t2 >> 16 & 255) : 64 === s2 ? String.fromCharCode(t2 >> 16 & 255, t2 >> 8 & 255) : String.fromCharCode(t2 >> 16 & 255, t2 >> 8 & 255, 255 & t2);
    return r2;
  } : atob;
  var Fs = n(function(e2, t2) {
    Object.defineProperty(t2, "__esModule", { value: true });
    const n2 = "chooseAndUploadFile:ok", s2 = "chooseAndUploadFile:fail";
    function r2(e3, t3) {
      return e3.tempFiles.forEach((e4, n3) => {
        e4.name || (e4.name = e4.path.substring(e4.path.lastIndexOf("/") + 1)), t3 && (e4.fileType = t3), e4.cloudPath = Date.now() + "_" + n3 + e4.name.substring(e4.name.lastIndexOf("."));
      }), e3.tempFilePaths || (e3.tempFilePaths = e3.tempFiles.map((e4) => e4.path)), e3;
    }
    function i2(e3, t3, { onChooseFile: s3, onUploadProgress: r3 }) {
      return t3.then((e4) => {
        if (s3) {
          const t4 = s3(e4);
          if (void 0 !== t4)
            return Promise.resolve(t4).then((t5) => void 0 === t5 ? e4 : t5);
        }
        return e4;
      }).then((t4) => false === t4 ? { errMsg: n2, tempFilePaths: [], tempFiles: [] } : function(e4, t5, s4 = 5, r4) {
        (t5 = Object.assign({}, t5)).errMsg = n2;
        const i3 = t5.tempFiles, o2 = i3.length;
        let a2 = 0;
        return new Promise((n3) => {
          for (; a2 < s4; )
            c2();
          function c2() {
            const s5 = a2++;
            if (s5 >= o2)
              return void (!i3.find((e5) => !e5.url && !e5.errMsg) && n3(t5));
            const u2 = i3[s5];
            e4.uploadFile({ provider: u2.provider, filePath: u2.path, cloudPath: u2.cloudPath, fileType: u2.fileType, cloudPathAsRealPath: u2.cloudPathAsRealPath, onUploadProgress(e5) {
              e5.index = s5, e5.tempFile = u2, e5.tempFilePath = u2.path, r4 && r4(e5);
            } }).then((e5) => {
              u2.url = e5.fileID, s5 < o2 && c2();
            }).catch((e5) => {
              u2.errMsg = e5.errMsg || e5.message, s5 < o2 && c2();
            });
          }
        });
      }(e3, t4, 5, r3));
    }
    t2.initChooseAndUploadFile = function(e3) {
      return function(t3 = { type: "all" }) {
        return "image" === t3.type ? i2(e3, function(e4) {
          const { count: t4, sizeType: n3, sourceType: i3 = ["album", "camera"], extension: o2 } = e4;
          return new Promise((e5, a2) => {
            uni.chooseImage({ count: t4, sizeType: n3, sourceType: i3, extension: o2, success(t5) {
              e5(r2(t5, "image"));
            }, fail(e6) {
              a2({ errMsg: e6.errMsg.replace("chooseImage:fail", s2) });
            } });
          });
        }(t3), t3) : "video" === t3.type ? i2(e3, function(e4) {
          const { camera: t4, compressed: n3, maxDuration: i3, sourceType: o2 = ["album", "camera"], extension: a2 } = e4;
          return new Promise((e5, c2) => {
            uni.chooseVideo({ camera: t4, compressed: n3, maxDuration: i3, sourceType: o2, extension: a2, success(t5) {
              const { tempFilePath: n4, duration: s3, size: i4, height: o3, width: a3 } = t5;
              e5(r2({ errMsg: "chooseVideo:ok", tempFilePaths: [n4], tempFiles: [{ name: t5.tempFile && t5.tempFile.name || "", path: n4, size: i4, type: t5.tempFile && t5.tempFile.type || "", width: a3, height: o3, duration: s3, fileType: "video", cloudPath: "" }] }, "video"));
            }, fail(e6) {
              c2({ errMsg: e6.errMsg.replace("chooseVideo:fail", s2) });
            } });
          });
        }(t3), t3) : i2(e3, function(e4) {
          const { count: t4, extension: n3 } = e4;
          return new Promise((e5, i3) => {
            let o2 = uni.chooseFile;
            if ("undefined" != typeof wx && "function" == typeof wx.chooseMessageFile && (o2 = wx.chooseMessageFile), "function" != typeof o2)
              return i3({ errMsg: s2 + " 请指定 type 类型，该平台仅支持选择 image 或 video。" });
            o2({ type: "all", count: t4, extension: n3, success(t5) {
              e5(r2(t5));
            }, fail(e6) {
              i3({ errMsg: e6.errMsg.replace("chooseFile:fail", s2) });
            } });
          });
        }(t3), t3);
      };
    };
  }), Ks = t(Fs);
  const js = { auto: "auto", onready: "onready", manual: "manual" };
  function $s(e2) {
    return { props: { localdata: { type: Array, default: () => [] }, options: { type: [Object, Array], default: () => ({}) }, spaceInfo: { type: Object, default: () => ({}) }, collection: { type: [String, Array], default: "" }, action: { type: String, default: "" }, field: { type: String, default: "" }, orderby: { type: String, default: "" }, where: { type: [String, Object], default: "" }, pageData: { type: String, default: "add" }, pageCurrent: { type: Number, default: 1 }, pageSize: { type: Number, default: 20 }, getcount: { type: [Boolean, String], default: false }, gettree: { type: [Boolean, String], default: false }, gettreepath: { type: [Boolean, String], default: false }, startwith: { type: String, default: "" }, limitlevel: { type: Number, default: 10 }, groupby: { type: String, default: "" }, groupField: { type: String, default: "" }, distinct: { type: [Boolean, String], default: false }, foreignKey: { type: String, default: "" }, loadtime: { type: String, default: "auto" }, manual: { type: Boolean, default: false } }, data: () => ({ mixinDatacomLoading: false, mixinDatacomHasMore: false, mixinDatacomResData: [], mixinDatacomErrorMessage: "", mixinDatacomPage: {}, mixinDatacomError: null }), created() {
      this.mixinDatacomPage = { current: this.pageCurrent, size: this.pageSize, count: 0 }, this.$watch(() => {
        var e3 = [];
        return ["pageCurrent", "pageSize", "localdata", "collection", "action", "field", "orderby", "where", "getont", "getcount", "gettree", "groupby", "groupField", "distinct"].forEach((t2) => {
          e3.push(this[t2]);
        }), e3;
      }, (e3, t2) => {
        if (this.loadtime === js.manual)
          return;
        let n2 = false;
        const s2 = [];
        for (let r2 = 2; r2 < e3.length; r2++)
          e3[r2] !== t2[r2] && (s2.push(e3[r2]), n2 = true);
        e3[0] !== t2[0] && (this.mixinDatacomPage.current = this.pageCurrent), this.mixinDatacomPage.size = this.pageSize, this.onMixinDatacomPropsChange(n2, s2);
      });
    }, methods: { onMixinDatacomPropsChange(e3, t2) {
    }, mixinDatacomEasyGet({ getone: e3 = false, success: t2, fail: n2 } = {}) {
      this.mixinDatacomLoading || (this.mixinDatacomLoading = true, this.mixinDatacomErrorMessage = "", this.mixinDatacomError = null, this.mixinDatacomGet().then((n3) => {
        this.mixinDatacomLoading = false;
        const { data: s2, count: r2 } = n3.result;
        this.getcount && (this.mixinDatacomPage.count = r2), this.mixinDatacomHasMore = s2.length < this.pageSize;
        const i2 = e3 ? s2.length ? s2[0] : void 0 : s2;
        this.mixinDatacomResData = i2, t2 && t2(i2);
      }).catch((e4) => {
        this.mixinDatacomLoading = false, this.mixinDatacomErrorMessage = e4, this.mixinDatacomError = e4, n2 && n2(e4);
      }));
    }, mixinDatacomGet(t2 = {}) {
      let n2;
      t2 = t2 || {}, n2 = "undefined" != typeof __uniX && __uniX ? e2.databaseForJQL(this.spaceInfo) : e2.database(this.spaceInfo);
      const s2 = t2.action || this.action;
      s2 && (n2 = n2.action(s2));
      const r2 = t2.collection || this.collection;
      n2 = Array.isArray(r2) ? n2.collection(...r2) : n2.collection(r2);
      const i2 = t2.where || this.where;
      i2 && Object.keys(i2).length && (n2 = n2.where(i2));
      const o2 = t2.field || this.field;
      o2 && (n2 = n2.field(o2));
      const a2 = t2.foreignKey || this.foreignKey;
      a2 && (n2 = n2.foreignKey(a2));
      const c2 = t2.groupby || this.groupby;
      c2 && (n2 = n2.groupBy(c2));
      const u2 = t2.groupField || this.groupField;
      u2 && (n2 = n2.groupField(u2));
      true === (void 0 !== t2.distinct ? t2.distinct : this.distinct) && (n2 = n2.distinct());
      const h2 = t2.orderby || this.orderby;
      h2 && (n2 = n2.orderBy(h2));
      const l2 = void 0 !== t2.pageCurrent ? t2.pageCurrent : this.mixinDatacomPage.current, d2 = void 0 !== t2.pageSize ? t2.pageSize : this.mixinDatacomPage.size, p2 = void 0 !== t2.getcount ? t2.getcount : this.getcount, f2 = void 0 !== t2.gettree ? t2.gettree : this.gettree, g2 = void 0 !== t2.gettreepath ? t2.gettreepath : this.gettreepath, m2 = { getCount: p2 }, y2 = { limitLevel: void 0 !== t2.limitlevel ? t2.limitlevel : this.limitlevel, startWith: void 0 !== t2.startwith ? t2.startwith : this.startwith };
      return f2 && (m2.getTree = y2), g2 && (m2.getTreePath = y2), n2 = n2.skip(d2 * (l2 - 1)).limit(d2).get(m2), n2;
    } } };
  }
  function Bs(e2) {
    return function(t2, n2 = {}) {
      n2 = function(e3, t3 = {}) {
        return e3.customUI = t3.customUI || e3.customUI, e3.parseSystemError = t3.parseSystemError || e3.parseSystemError, Object.assign(e3.loadingOptions, t3.loadingOptions), Object.assign(e3.errorOptions, t3.errorOptions), "object" == typeof t3.secretMethods && (e3.secretMethods = t3.secretMethods), e3;
      }({ customUI: false, loadingOptions: { title: "加载中...", mask: true }, errorOptions: { type: "modal", retry: false } }, n2);
      const { customUI: s2, loadingOptions: r2, errorOptions: i2, parseSystemError: o2 } = n2, a2 = !s2;
      return new Proxy({}, { get(s3, c2) {
        switch (c2) {
          case "toString":
            return "[object UniCloudObject]";
          case "toJSON":
            return {};
        }
        return function({ fn: e3, interceptorName: t3, getCallbackArgs: n3 } = {}) {
          return async function(...s4) {
            const r3 = n3 ? n3({ params: s4 }) : {};
            let i3, o3;
            try {
              return await j($(t3, "invoke"), { ...r3 }), i3 = await e3(...s4), await j($(t3, "success"), { ...r3, result: i3 }), i3;
            } catch (e4) {
              throw o3 = e4, await j($(t3, "fail"), { ...r3, error: o3 }), o3;
            } finally {
              await j($(t3, "complete"), o3 ? { ...r3, error: o3 } : { ...r3, result: i3 });
            }
          };
        }({ fn: async function s4(...u2) {
          let h2;
          a2 && uni.showLoading({ title: r2.title, mask: r2.mask });
          const d2 = { name: t2, type: l.OBJECT, data: { method: c2, params: u2 } };
          "object" == typeof n2.secretMethods && function(e3, t3) {
            const n3 = t3.data.method, s5 = e3.secretMethods || {}, r3 = s5[n3] || s5["*"];
            r3 && (t3.secretType = r3);
          }(n2, d2);
          let p2 = false;
          try {
            h2 = await e2.callFunction(d2);
          } catch (e3) {
            p2 = true, h2 = { result: new te(e3) };
          }
          const { errSubject: f2, errCode: g2, errMsg: m2, newToken: y2 } = h2.result || {};
          if (a2 && uni.hideLoading(), y2 && y2.token && y2.tokenExpired && (ie(y2), Y(H.REFRESH_TOKEN, { ...y2 })), g2) {
            let e3 = m2;
            if (p2 && o2) {
              e3 = (await o2({ objectName: t2, methodName: c2, params: u2, errSubject: f2, errCode: g2, errMsg: m2 })).errMsg || m2;
            }
            if (a2)
              if ("toast" === i2.type)
                uni.showToast({ title: e3, icon: "none" });
              else {
                if ("modal" !== i2.type)
                  throw new Error(`Invalid errorOptions.type: ${i2.type}`);
                {
                  const { confirm: t3 } = await async function({ title: e4, content: t4, showCancel: n4, cancelText: s5, confirmText: r3 } = {}) {
                    return new Promise((i3, o3) => {
                      uni.showModal({ title: e4, content: t4, showCancel: n4, cancelText: s5, confirmText: r3, success(e5) {
                        i3(e5);
                      }, fail() {
                        i3({ confirm: false, cancel: true });
                      } });
                    });
                  }({ title: "提示", content: e3, showCancel: i2.retry, cancelText: "取消", confirmText: i2.retry ? "重试" : "确定" });
                  if (i2.retry && t3)
                    return s4(...u2);
                }
              }
            const n3 = new te({ subject: f2, code: g2, message: m2, requestId: h2.requestId });
            throw n3.detail = h2.result, Y(H.RESPONSE, { type: J.CLOUD_OBJECT, content: n3 }), n3;
          }
          return Y(H.RESPONSE, { type: J.CLOUD_OBJECT, content: h2.result }), h2.result;
        }, interceptorName: "callObject", getCallbackArgs: function({ params: e3 } = {}) {
          return { objectName: t2, methodName: c2, params: e3 };
        } });
      } });
    };
  }
  function Ws(e2) {
    return U(Xt.replace("{spaceId}", e2.config.spaceId));
  }
  async function Hs({ openid: e2, callLoginByWeixin: t2 = false } = {}) {
    Ws(this);
    throw new Error(`[SecureNetwork] API \`initSecureNetworkByWeixin\` is not supported on platform \`${P}\``);
  }
  async function Js(e2) {
    const t2 = Ws(this);
    return t2.initPromise || (t2.initPromise = Hs.call(this, e2).then((e3) => e3).catch((e3) => {
      throw delete t2.initPromise, e3;
    })), t2.initPromise;
  }
  function zs(e2) {
    return function({ openid: t2, callLoginByWeixin: n2 = false } = {}) {
      return Js.call(e2, { openid: t2, callLoginByWeixin: n2 });
    };
  }
  function Vs(e2) {
    !function(e3) {
      he = e3;
    }(e2);
  }
  function Gs(e2) {
    const n2 = { getAppBaseInfo: uni.getSystemInfo, getPushClientId: uni.getPushClientId };
    return function(s2) {
      return new Promise((r2, i2) => {
        n2[e2]({ ...s2, success(e3) {
          r2(e3);
        }, fail(e3) {
          i2(e3);
        } });
      });
    };
  }
  class Ys extends S {
    constructor() {
      super(), this._uniPushMessageCallback = this._receivePushMessage.bind(this), this._currentMessageId = -1, this._payloadQueue = [];
    }
    init() {
      return Promise.all([Gs("getAppBaseInfo")(), Gs("getPushClientId")()]).then(([{ appId: e2 } = {}, { cid: t2 } = {}] = []) => {
        if (!e2)
          throw new Error("Invalid appId, please check the manifest.json file");
        if (!t2)
          throw new Error("Invalid push client id");
        this._appId = e2, this._pushClientId = t2, this._seqId = Date.now() + "-" + Math.floor(9e5 * Math.random() + 1e5), this.emit("open"), this._initMessageListener();
      }, (e2) => {
        throw this.emit("error", e2), this.close(), e2;
      });
    }
    async open() {
      return this.init();
    }
    _isUniCloudSSE(e2) {
      if ("receive" !== e2.type)
        return false;
      const t2 = e2 && e2.data && e2.data.payload;
      return !(!t2 || "UNI_CLOUD_SSE" !== t2.channel || t2.seqId !== this._seqId);
    }
    _receivePushMessage(e2) {
      if (!this._isUniCloudSSE(e2))
        return;
      const t2 = e2 && e2.data && e2.data.payload, { action: n2, messageId: s2, message: r2 } = t2;
      this._payloadQueue.push({ action: n2, messageId: s2, message: r2 }), this._consumMessage();
    }
    _consumMessage() {
      for (; ; ) {
        const e2 = this._payloadQueue.find((e3) => e3.messageId === this._currentMessageId + 1);
        if (!e2)
          break;
        this._currentMessageId++, this._parseMessagePayload(e2);
      }
    }
    _parseMessagePayload(e2) {
      const { action: t2, messageId: n2, message: s2 } = e2;
      "end" === t2 ? this._end({ messageId: n2, message: s2 }) : "message" === t2 && this._appendMessage({ messageId: n2, message: s2 });
    }
    _appendMessage({ messageId: e2, message: t2 } = {}) {
      this.emit("message", t2);
    }
    _end({ messageId: e2, message: t2 } = {}) {
      this.emit("end", t2), this.close();
    }
    _initMessageListener() {
      uni.onPushMessage(this._uniPushMessageCallback);
    }
    _destroy() {
      uni.offPushMessage(this._uniPushMessageCallback);
    }
    toJSON() {
      return { appId: this._appId, pushClientId: this._pushClientId, seqId: this._seqId };
    }
    close() {
      this._destroy(), this.emit("close");
    }
  }
  async function Qs(e2) {
    {
      const { osName: e3, osVersion: t3 } = ce();
      "ios" === e3 && function(e4) {
        if (!e4 || "string" != typeof e4)
          return 0;
        const t4 = e4.match(/^(\d+)./);
        return t4 && t4[1] ? parseInt(t4[1]) : 0;
      }(t3) >= 14 && console.warn("iOS 14及以上版本连接uniCloud本地调试服务需要允许客户端查找并连接到本地网络上的设备（仅开发期间需要，发行后不需要）");
    }
    const t2 = e2.__dev__;
    if (!t2.debugInfo)
      return;
    const { address: n2, servePort: s2 } = t2.debugInfo, { address: r2 } = await Ot(n2, s2);
    if (r2)
      return t2.localAddress = r2, void (t2.localPort = s2);
    const i2 = console["error"];
    let o2 = "";
    if ("remote" === t2.debugInfo.initialLaunchType ? (t2.debugInfo.forceRemote = true, o2 = "当前客户端和HBuilderX不在同一局域网下（或其他网络原因无法连接HBuilderX），uniCloud本地调试服务不对当前客户端生效。\n- 如果不使用uniCloud本地调试服务，请直接忽略此信息。\n- 如需使用uniCloud本地调试服务，请将客户端与主机连接到同一局域网下并重新运行到客户端。") : o2 = "无法连接uniCloud本地调试服务，请检查当前客户端是否与主机在同一局域网下。\n- 如需使用uniCloud本地调试服务，请将客户端与主机连接到同一局域网下并重新运行到客户端。", o2 += "\n- 如果在HBuilderX开启的状态下切换过网络环境，请重启HBuilderX后再试\n- 检查系统防火墙是否拦截了HBuilderX自带的nodejs\n- 检查是否错误的使用拦截器修改uni.request方法的参数", 0 === P.indexOf("mp-") && (o2 += "\n- 小程序中如何使用uniCloud，请参考：https://uniapp.dcloud.net.cn/uniCloud/publish.html#useinmp"), !t2.debugInfo.forceRemote)
      throw new Error(o2);
    i2(o2);
  }
  function Xs(e2) {
    e2._initPromiseHub || (e2._initPromiseHub = new v({ createPromise: function() {
      let t2 = Promise.resolve();
      var n2;
      n2 = 1, t2 = new Promise((e3) => {
        setTimeout(() => {
          e3();
        }, n2);
      });
      const s2 = e2.auth();
      return t2.then(() => s2.getLoginState()).then((e3) => e3 ? Promise.resolve() : s2.signInAnonymously());
    } }));
  }
  const Zs = { tcb: Pt, tencent: Pt, aliyun: fe, private: Rt, dcloud: Rt, alipay: Bt };
  let er = new class {
    init(e2) {
      let t2 = {};
      const n2 = Zs[e2.provider];
      if (!n2)
        throw new Error("未提供正确的provider参数");
      t2 = n2.init(e2), function(e3) {
        const t3 = {};
        e3.__dev__ = t3, t3.debugLog = "app" === P;
        const n3 = C;
        n3 && !n3.code && (t3.debugInfo = n3);
        const s2 = new v({ createPromise: function() {
          return Qs(e3);
        } });
        t3.initLocalNetwork = function() {
          return s2.exec();
        };
      }(t2), Xs(t2), Gn(t2), function(e3) {
        const t3 = e3.uploadFile;
        e3.uploadFile = function(e4) {
          return t3.call(this, e4);
        };
      }(t2), function(e3) {
        e3.database = function(t3) {
          if (t3 && Object.keys(t3).length > 0)
            return e3.init(t3).database();
          if (this._database)
            return this._database;
          const n3 = as(cs, { uniClient: e3 });
          return this._database = n3, n3;
        }, e3.databaseForJQL = function(t3) {
          if (t3 && Object.keys(t3).length > 0)
            return e3.init(t3).databaseForJQL();
          if (this._databaseForJQL)
            return this._databaseForJQL;
          const n3 = as(cs, { uniClient: e3, isJQL: true });
          return this._databaseForJQL = n3, n3;
        };
      }(t2), function(e3) {
        e3.getCurrentUserInfo = qs, e3.chooseAndUploadFile = Ks.initChooseAndUploadFile(e3), Object.assign(e3, { get mixinDatacom() {
          return $s(e3);
        } }), e3.SSEChannel = Ys, e3.initSecureNetworkByWeixin = zs(e3), e3.setCustomClientInfo = Vs, e3.importObject = Bs(e3);
      }(t2);
      return ["callFunction", "uploadFile", "deleteFile", "getTempFileURL", "downloadFile", "chooseAndUploadFile"].forEach((e3) => {
        if (!t2[e3])
          return;
        const n3 = t2[e3];
        t2[e3] = function() {
          return n3.apply(t2, Array.from(arguments));
        }, t2[e3] = (/* @__PURE__ */ function(e4, t3) {
          return function(n4) {
            let s2 = false;
            if ("callFunction" === t3) {
              const e5 = n4 && n4.type || l.DEFAULT;
              s2 = e5 !== l.DEFAULT;
            }
            const r2 = "callFunction" === t3 && !s2, i2 = this._initPromiseHub.exec();
            n4 = n4 || {};
            const { success: o2, fail: a2, complete: c2 } = ee(n4), u2 = i2.then(() => s2 ? Promise.resolve() : j($(t3, "invoke"), n4)).then(() => e4.call(this, n4)).then((e5) => s2 ? Promise.resolve(e5) : j($(t3, "success"), e5).then(() => j($(t3, "complete"), e5)).then(() => (r2 && Y(H.RESPONSE, { type: J.CLOUD_FUNCTION, content: e5 }), Promise.resolve(e5))), (e5) => s2 ? Promise.reject(e5) : j($(t3, "fail"), e5).then(() => j($(t3, "complete"), e5)).then(() => (Y(H.RESPONSE, { type: J.CLOUD_FUNCTION, content: e5 }), Promise.reject(e5))));
            if (!(o2 || a2 || c2))
              return u2;
            u2.then((e5) => {
              o2 && o2(e5), c2 && c2(e5), r2 && Y(H.RESPONSE, { type: J.CLOUD_FUNCTION, content: e5 });
            }, (e5) => {
              a2 && a2(e5), c2 && c2(e5), r2 && Y(H.RESPONSE, { type: J.CLOUD_FUNCTION, content: e5 });
            });
          };
        }(t2[e3], e3)).bind(t2);
      }), t2.init = this.init, t2;
    }
  }();
  (() => {
    const e2 = O;
    let t2 = {};
    if (e2 && 1 === e2.length)
      t2 = e2[0], er = er.init(t2), er._isDefault = true;
    else {
      const t3 = ["auth", "callFunction", "uploadFile", "deleteFile", "getTempFileURL", "downloadFile"], n2 = ["database", "getCurrentUserInfo", "importObject"];
      let s2;
      s2 = e2 && e2.length > 0 ? "应用有多个服务空间，请通过uniCloud.init方法指定要使用的服务空间" : "应用未关联服务空间，请在uniCloud目录右键关联服务空间", [...t3, ...n2].forEach((e3) => {
        er[e3] = function() {
          if (console.error(s2), -1 === n2.indexOf(e3))
            return Promise.reject(new te({ code: "SYS_ERR", message: s2 }));
          console.error(s2);
        };
      });
    }
    if (Object.assign(er, { get mixinDatacom() {
      return $s(er);
    } }), Ls(er), er.addInterceptor = F, er.removeInterceptor = K, er.interceptObject = B, uni.__uniCloud = er, "app" === P) {
      const e3 = D();
      e3.uniCloud = er, e3.UniCloudError = te;
    }
  })();
  var tr = er;
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const _sfc_main$7 = {
    __name: "login",
    setup(__props, { expose: __expose }) {
      __expose();
      const username = vue.ref("");
      const password = vue.ref("");
      const captchaInput = vue.ref("");
      const captchaCode = vue.ref("");
      const isLoading = vue.ref(false);
      const generateCaptcha = () => {
        let code = "";
        for (let i2 = 0; i2 < 4; i2++) {
          code += chars[Math.floor(Math.random() * chars.length)];
        }
        captchaCode.value = code;
        captchaInput.value = "";
      };
      const captchaCharStyle = (index) => {
        const rotations = [-8, 5, -4, 6];
        const colors = ["#FF85A1", "#4A4E69", "#E91E63", "#5C6BC0"];
        return {
          transform: `rotate(${rotations[index]}deg)`,
          color: colors[index % colors.length]
        };
      };
      vue.onMounted(() => {
        generateCaptcha();
      });
      const handleLogin = async () => {
        if (!username.value || !password.value) {
          uni.showToast({
            title: "请输入用户名和密码",
            icon: "none"
          });
          return;
        }
        const input = captchaInput.value.toUpperCase().trim();
        if (input !== captchaCode.value) {
          uni.showToast({
            title: "验证码错误",
            icon: "none"
          });
          generateCaptcha();
          return;
        }
        isLoading.value = true;
        try {
          uni.showLoading({
            title: "请稍候...",
            mask: true
          });
          const result = await tr.callFunction({
            name: "user-center",
            data: {
              username: username.value,
              password: password.value
            }
          });
          uni.hideLoading();
          if (result.result && result.result.code === 0) {
            uni.setStorageSync("uid", result.result.uid);
            uni.setStorageSync("username", result.result.username);
            uni.setStorageSync("userDisplayName", result.result.displayName || result.result.username);
            uni.showToast({
              title: result.result.msg,
              icon: "success"
            });
            setTimeout(() => {
              uni.navigateBack();
            }, 1500);
          } else {
            uni.showToast({
              title: result.result ? result.result.msg : "登录失败",
              icon: "none"
            });
            generateCaptcha();
          }
        } catch (e2) {
          uni.hideLoading();
          formatAppLog("error", "at pages/login/login.vue:158", "登录失败:", e2);
          uni.showToast({
            title: "网络错误，请稍后重试",
            icon: "none"
          });
          generateCaptcha();
        } finally {
          isLoading.value = false;
        }
      };
      const __returned__ = { username, password, captchaInput, captchaCode, isLoading, chars, generateCaptcha, captchaCharStyle, handleLogin, ref: vue.ref, onMounted: vue.onMounted };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "login-box" }, [
        vue.createElementVNode("view", { class: "title-wrap" }, [
          vue.createElementVNode("text", { class: "title" }, "个人单词本"),
          vue.createElementVNode("text", { class: "subtitle" }, "登录 / 注册")
        ]),
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("view", { class: "label" }, "用户名"),
          vue.createElementVNode("view", {
            class: "input-wrap",
            onClick: _cache[1] || (_cache[1] = vue.withModifiers(() => {
            }, ["stop"]))
          }, [
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                type: "text",
                "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.username = $event),
                placeholder: "请输入用户名",
                class: "input"
              },
              null,
              512
              /* NEED_PATCH */
            ), [
              [vue.vModelText, $setup.username]
            ])
          ])
        ]),
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("view", { class: "label" }, "密码"),
          vue.createElementVNode("view", {
            class: "input-wrap",
            onClick: _cache[3] || (_cache[3] = vue.withModifiers(() => {
            }, ["stop"]))
          }, [
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                type: "password",
                "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $setup.password = $event),
                placeholder: "请输入密码",
                class: "input"
              },
              null,
              512
              /* NEED_PATCH */
            ), [
              [vue.vModelText, $setup.password]
            ])
          ])
        ]),
        vue.createElementVNode("view", { class: "form-item captcha-row" }, [
          vue.createElementVNode("view", { class: "captcha-label-wrap" }, [
            vue.createElementVNode("view", { class: "label" }, "验证码"),
            vue.createElementVNode("view", {
              class: "captcha-refresh",
              onClick: $setup.generateCaptcha
            }, "换一张")
          ]),
          vue.createElementVNode("view", { class: "captcha-input-row" }, [
            vue.createElementVNode("view", {
              class: "input-wrap",
              onClick: _cache[5] || (_cache[5] = vue.withModifiers(() => {
              }, ["stop"]))
            }, [
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  type: "text",
                  "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $setup.captchaInput = $event),
                  placeholder: "请输入验证码",
                  class: "input captcha-input",
                  maxlength: "4"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.captchaInput]
              ])
            ]),
            vue.createElementVNode("view", {
              class: "captcha-display",
              onClick: vue.withModifiers($setup.generateCaptcha, ["stop"])
            }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.captchaCode, (ch, i2) => {
                  return vue.openBlock(), vue.createElementBlock(
                    "view",
                    {
                      key: i2,
                      class: "captcha-char",
                      style: vue.normalizeStyle($setup.captchaCharStyle(i2))
                    },
                    vue.toDisplayString(ch),
                    5
                    /* TEXT, STYLE */
                  );
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])
          ])
        ]),
        vue.createElementVNode("button", {
          class: "login-btn",
          onClick: $setup.handleLogin,
          disabled: $setup.isLoading
        }, vue.toDisplayString($setup.isLoading ? "处理中..." : "登录 / 注册"), 9, ["disabled"])
      ])
    ]);
  }
  const PagesLoginLogin = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$7], ["__scopeId", "data-v-e4e4508d"], ["__file", "E:/vocal/wordbook_new/pages/login/login.vue"]]);
  const _sfc_main$6 = {
    __name: "my",
    setup(__props, { expose: __expose }) {
      __expose();
      const uid = vue.ref("");
      const username = vue.ref("");
      const userDisplayName = vue.ref("");
      const isLoggedIn2 = vue.ref(false);
      const localWordCount = vue.ref(0);
      const totalViewCount = vue.ref(0);
      const lastReviewAccuracy = vue.ref(null);
      const lastReviewResult = vue.ref(null);
      const showAiSuggestionModal = vue.ref(false);
      const showImportModal = vue.ref(false);
      const aiSuggestionText = vue.ref("");
      const currentWordbookKey = vue.ref(getCurrentWordbook());
      const learningSnapshot = vue.ref({ dueCount: 0, mistakeCount: 0, firstDayDue: 0 });
      const studyStats = vue.ref({ streak: 0 });
      const displayName = vue.computed(() => {
        if (!isLoggedIn2.value)
          return "未登录";
        const name = (userDisplayName.value || username.value || "").trim();
        return name ? `用户名：${name}` : "用户名：—";
      });
      const currentWordbookLabel = vue.computed(() => {
        const id = currentWordbookKey.value;
        const list = getWordbookListForUI();
        const item = list.find((o2) => o2.id === id);
        return item ? item.name : "自用单词";
      });
      const goToWordbookList = () => {
        uni.navigateTo({ url: "/pages/wordbook-list/wordbook-list" });
      };
      const goToStats = () => {
        uni.navigateTo({ url: "/pages/stats/stats" });
      };
      const goToMistakes = () => {
        uni.navigateTo({ url: "/pages/mistakes/mistakes" });
      };
      const goToMasteredWords = () => {
        uni.navigateTo({ url: "/pages/mastered-words/mastered-words" });
      };
      const goToDueReview = () => {
        uni.navigateTo({ url: "/pages/review/review?preset=due" });
      };
      const userInitial = vue.computed(() => {
        const name = (userDisplayName.value || username.value || "").trim();
        if (name)
          return name.charAt(0).toUpperCase();
        return "?";
      });
      const goToEditNickname = () => {
        uni.navigateTo({ url: "/pages/my/edit-nickname" });
      };
      onShow(() => {
        currentWordbookKey.value = getCurrentWordbook();
        checkLoginStatus();
      });
      const onWordbookChanged = () => {
        currentWordbookKey.value = getCurrentWordbook();
      };
      uni.$on("wordbookChanged", onWordbookChanged);
      onUnload(() => {
        uni.$off("wordbookChanged", onWordbookChanged);
        try {
          cleanupExpiredCaches();
        } catch (error) {
          logger.warn("My", "清理缓存失败", error);
        }
      });
      const checkLoginStatus = () => {
        uid.value = uni.getStorageSync("uid") || "";
        username.value = uni.getStorageSync("username") || "";
        userDisplayName.value = uni.getStorageSync("userDisplayName") || "";
        isLoggedIn2.value = !!uid.value;
        const last = getLatestSession(getCurrentWordbook()) || uni.getStorageSync("lastReviewResult");
        lastReviewResult.value = last || null;
        lastReviewAccuracy.value = last ? typeof last.accuracy === "number" ? last.accuracy : Math.round(Number(last.correctCount || 0) / Math.max(1, Number(last.reviewedCount || 0)) * 100) : null;
        loadLocalWordCount();
      };
      const loadLocalWordCount = async () => {
        try {
          const words = await db.getAllWords();
          localWordCount.value = words.length;
          totalViewCount.value = words.reduce((s2, w2) => s2 + (w2.view_count || 0), 0);
          const currentBook = getCurrentWordbook();
          let currentPool = words;
          if (currentBook !== "self") {
            if (isLocalWordbookKey(currentBook))
              currentPool = await loadLocalWordbook(currentBook);
            else
              currentPool = getWordbookWords(currentBook) || [];
          }
          learningSnapshot.value = getLearningDashboard(currentPool, currentBook);
          studyStats.value = getStudyStats(currentPool, currentBook);
        } catch (e2) {
          formatAppLog("error", "at pages/my/my.vue:379", "获取本地单词数失败:", e2);
          localWordCount.value = 0;
          totalViewCount.value = 0;
          learningSnapshot.value = { dueCount: 0, mistakeCount: 0, firstDayDue: 0 };
          studyStats.value = { streak: 0 };
        }
      };
      const goToLogin = () => {
        uni.navigateTo({
          url: "/pages/login/login"
        });
      };
      const handleLogout = () => {
        uni.showModal({
          title: "确认退出",
          content: "确定要退出登录吗？",
          success: (res) => {
            if (res.confirm) {
              uni.removeStorageSync("uid");
              uni.removeStorageSync("username");
              uni.removeStorageSync("userDisplayName");
              uid.value = "";
              username.value = "";
              userDisplayName.value = "";
              isLoggedIn2.value = false;
              setCurrentWordbook("红宝书");
              currentWordbookKey.value = "红宝书";
              uni.$emit("wordbookChanged", "红宝书");
              uni.showToast({
                title: "已退出登录",
                icon: "success"
              });
            }
          }
        });
      };
      const uploadToCloud = async () => {
        if (!isLoggedIn2.value) {
          uni.showToast({
            title: "请先登录",
            icon: "none"
          });
          return;
        }
        uni.showLoading({
          title: "正在备份...",
          mask: true
        });
        try {
          const words = await db.getAllWords();
          const lightWords = words.map((w2) => ({
            english: w2.english,
            source_page: w2.source_page || "",
            year: w2.year || "",
            create_time: w2.create_time || (/* @__PURE__ */ new Date()).toISOString(),
            update_time: w2.update_time || (/* @__PURE__ */ new Date()).toISOString()
          }));
          formatAppLog("log", "at pages/my/my.vue:444", "准备上传的轻量单词数据:", lightWords.length);
          const result = await tr.callFunction({
            name: "word-sync",
            data: {
              action: "upload",
              uid: uid.value,
              words: lightWords
            }
          });
          uni.hideLoading();
          if (result.result && result.result.code === 0) {
            uni.showToast({
              title: "备份成功",
              icon: "success"
            });
          } else {
            uni.showToast({
              title: result.result ? result.result.msg : "备份失败",
              icon: "none"
            });
          }
        } catch (e2) {
          uni.hideLoading();
          formatAppLog("error", "at pages/my/my.vue:470", "备份失败:", e2);
          uni.showToast({
            title: "备份失败: " + e2.message,
            icon: "none"
          });
        }
      };
      const downloadFromCloud = async () => {
        if (!isLoggedIn2.value) {
          uni.showToast({
            title: "请先登录",
            icon: "none"
          });
          return;
        }
        uni.showModal({
          title: "确认恢复",
          content: "从云端恢复会覆盖本地数据，确定要继续吗？",
          success: async (res) => {
            if (res.confirm) {
              await performDownload();
            }
          }
        });
      };
      const performDownload = async () => {
        const uid2 = uni.getStorageSync("uid");
        if (!uid2) {
          return uni.showToast({ title: "请先登录账号", icon: "none" });
        }
        uni.showLoading({ title: "正在连接云端..." });
        try {
          formatAppLog("log", "at pages/my/my.vue:507", "🚀 --- 开始向云端要数据, 账号 uid:", uid2);
          const res = await tr.callFunction({
            name: "word-sync",
            data: {
              action: "download",
              uid: uid2
            }
          });
          formatAppLog("log", "at pages/my/my.vue:517", "📦 云端返回的完整包裹:", res);
          if (res.result.code === 0) {
            const cloudWords = res.result.words || res.result.data || [];
            if (cloudWords && cloudWords.length > 0) {
              formatAppLog("log", "at pages/my/my.vue:523", `✅ 成功拿到 ${cloudWords.length} 个单词！准备写入本地...`);
              const englishList = cloudWords.map((w2) => (w2.english || "").trim()).filter(Boolean);
              const briefMap = await getWordBriefBatch(englishList).catch(() => ({}));
              const restored = [];
              for (const w2 of cloudWords) {
                const snapshot = await getLocalWordSnapshot(w2.english, { briefMap });
                restored.push({
                  ...w2,
                  chinese: snapshot.chinese || "",
                  tags: snapshot.tags || "",
                  importance: typeof snapshot.importance === "number" ? snapshot.importance : w2.importance || 0,
                  repeat_count: w2.repeat_count || 1,
                  view_count: w2.view_count != null ? w2.view_count : 0,
                  examples: snapshot.examples || [],
                  synonyms: snapshot.synonyms || [],
                  antonyms: snapshot.antonyms || []
                });
              }
              await db.clearAndInsertWords(restored);
              await loadLocalWordCount();
              uni.showToast({ title: `成功恢复 ${cloudWords.length} 个单词`, icon: "success" });
              uni.$emit("refreshWordList");
              uni.showModal({
                title: "恢复成功",
                content: "请返回首页查看恢复的单词",
                showCancel: false
              });
            } else {
              uni.showToast({ title: "您的云端词库是空的", icon: "none" });
            }
          } else {
            formatAppLog("error", "at pages/my/my.vue:559", "❌ 云端拒绝了请求:", res.result.msg);
            uni.showToast({ title: res.result.msg || "恢复失败", icon: "none" });
          }
        } catch (error) {
          formatAppLog("error", "at pages/my/my.vue:564", "💥 前端请求崩溃:", error);
          uni.showToast({ title: "网络通信异常", icon: "error" });
        } finally {
          uni.hideLoading();
        }
      };
      const exportCsv = async () => {
        try {
          const words = await db.getAllWords();
          if (!words.length) {
            uni.showToast({ title: "暂无单词可导出", icon: "none" });
            return;
          }
          const header = "英文,中文,标签,页码,年份,重要程度\n";
          const rows = words.map((w2) => {
            const eng = (w2.english || "").replace(/"/g, '""');
            const chi = (w2.chinese || "").replace(/"/g, '""');
            const tags = (w2.tags || "").replace(/"/g, '""');
            return `"${eng}","${chi}","${tags}",${w2.source_page || ""},${w2.year || ""},${w2.importance ?? ""}`;
          });
          const csv = "\uFEFF" + header + rows.join("\n");
          uni.setClipboardData({
            data: csv,
            success: () => uni.showToast({ title: "已复制到剪贴板", icon: "success" })
          });
        } catch (e2) {
          uni.showToast({ title: "导出失败", icon: "none" });
        }
      };
      const exportTxt = async () => {
        try {
          const words = await db.getAllWords();
          if (!words.length) {
            uni.showToast({ title: "暂无单词可导出", icon: "none" });
            return;
          }
          const txt = words.map((w2) => `${w2.english || ""}	${w2.chinese || ""}`).join("\n");
          uni.setClipboardData({
            data: txt,
            success: () => uni.showToast({ title: "已复制到剪贴板", icon: "success" })
          });
        } catch (e2) {
          uni.showToast({ title: "导出失败", icon: "none" });
        }
      };
      const exportTxtEnglishOnly = async () => {
        try {
          const words = await db.getAllWords();
          if (!words.length) {
            uni.showToast({ title: "暂无单词可导出", icon: "none" });
            return;
          }
          const txt = words.map((w2) => w2.english || "").filter(Boolean).join("\n");
          uni.setClipboardData({
            data: txt,
            success: () => uni.showToast({ title: "已复制到剪贴板", icon: "success" })
          });
        } catch (e2) {
          uni.showToast({ title: "导出失败", icon: "none" });
        }
      };
      const chooseImportFile = () => {
        showImportModal.value = true;
      };
      const handleFileImport = () => {
        const isH5 = typeof window !== "undefined" && typeof document !== "undefined";
        if (isH5) {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".csv,.txt";
          input.style.cssText = "position:fixed;top:-100px;left:-100px;opacity:0;";
          input.onchange = (e2) => {
            const file = e2.target && e2.target.files && e2.target.files[0];
            if (file) {
              readAndImportFile(file);
              showImportModal.value = false;
            }
          };
          document.body.appendChild(input);
          setTimeout(() => input.click(), 100);
        } else {
          showImportModal.value = false;
          uni.getClipboardData({
            success: (clipRes) => {
              const text = clipRes.data || "";
              if (!text.trim()) {
                uni.showToast({ title: "剪贴板为空", icon: "none" });
                return;
              }
              parseAndImport(text, (err, count) => {
                if (err)
                  uni.showToast({ title: err, icon: "none", duration: 3e3 });
                else {
                  uni.showToast({ title: `成功导入 ${count} 个单词`, icon: "success" });
                  uni.$emit("refreshWordList");
                  loadLocalWordCount();
                }
              });
            },
            fail: () => {
              uni.showToast({ title: "读取剪贴板失败", icon: "none" });
            }
          });
        }
      };
      const readAndImportFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e2) => {
          const text = e2.target && e2.target.result || "";
          parseAndImport(text, (err, count) => {
            if (err)
              uni.showToast({ title: err, icon: "none" });
            else
              uni.showToast({ title: `成功导入 ${count} 个单词`, icon: "success" });
            uni.$emit("refreshWordList");
            loadLocalWordCount();
          });
        };
        reader.readAsText(file, "UTF-8");
      };
      function parseAndImport(text, callback) {
        const lines = text.split(/\r?\n/).map((l2) => l2.trim()).filter(Boolean);
        if (!lines.length) {
          callback("文件为空或格式不正确", 0);
          return;
        }
        const words = [];
        const isCsv = /,|"/.test(lines[0]);
        for (let i2 = 0; i2 < lines.length; i2++) {
          const line = lines[i2];
          let eng = "";
          let chi = "";
          if (isCsv) {
            const m2 = line.match(/("(?:[^"]|"")*"|[^,]*)/g);
            if (m2 && m2.length >= 2) {
              eng = (m2[0] || "").replace(/^"|"$/g, "").replace(/""/g, '"').trim();
              chi = (m2[1] || "").replace(/^"|"$/g, "").replace(/""/g, '"').trim();
            }
          } else {
            const idx = line.indexOf("	");
            if (idx >= 0) {
              eng = line.slice(0, idx).trim();
              chi = line.slice(idx + 1).trim();
            } else {
              const sp = line.split(/\s+/);
              eng = sp[0] || "";
              chi = sp.slice(1).join(" ").trim();
            }
          }
          if (eng) {
            words.push({
              english: eng,
              chinese: chi || "",
              importance: 3
            });
          }
        }
        if (!words.length) {
          callback("未能解析出有效单词", 0);
          return;
        }
        (async () => {
          const existingWords = await db.getAllWords().catch(() => []);
          const existingSet = new Set(
            (existingWords || []).map((w2) => String((w2 == null ? void 0 : w2.english) || "").trim().toLowerCase()).filter(Boolean)
          );
          const englishList = [...new Set(words.map((w2) => String(w2.english || "").trim()).filter(Boolean))];
          const briefMap = await getWordBriefBatch(englishList).catch(() => ({}));
          let count = 0;
          for (const w2 of words) {
            try {
              const key = String(w2.english || "").trim().toLowerCase();
              if (!key || existingSet.has(key))
                continue;
              const snapshot = await getLocalWordSnapshot(w2.english, { briefMap });
              await db.addWord({
                ...w2,
                chinese: snapshot.chinese || w2.chinese || "",
                tags: snapshot.tags || "",
                importance: typeof snapshot.importance === "number" ? snapshot.importance : w2.importance || 0,
                examples: snapshot.examples || [],
                synonyms: snapshot.synonyms || [],
                antonyms: snapshot.antonyms || []
              });
              existingSet.add(key);
              count++;
            } catch (e2) {
              formatAppLog("warn", "at pages/my/my.vue:766", "跳过重复或无效:", w2.english, e2);
            }
          }
          callback(null, count);
        })();
      }
      const openAiSuggestion = async () => {
        showAiSuggestionModal.value = true;
        lastReviewResult.value = getLatestSession(getCurrentWordbook()) || uni.getStorageSync("lastReviewResult") || null;
        aiSuggestionText.value = "正在生成建议...";
        try {
          const words = await db.getAllWords();
          const suggestion = await aiService.generateReviewSuggestion(words);
          aiSuggestionText.value = suggestion || "暂无建议";
        } catch (e2) {
          aiSuggestionText.value = "生成失败，请检查网络或稍后重试。";
        }
      };
      const __returned__ = { uid, username, userDisplayName, isLoggedIn: isLoggedIn2, localWordCount, totalViewCount, lastReviewAccuracy, lastReviewResult, showAiSuggestionModal, showImportModal, aiSuggestionText, currentWordbookKey, learningSnapshot, studyStats, displayName, currentWordbookLabel, goToWordbookList, goToStats, goToMistakes, goToMasteredWords, goToDueReview, userInitial, goToEditNickname, onWordbookChanged, checkLoginStatus, loadLocalWordCount, goToLogin, handleLogout, uploadToCloud, downloadFromCloud, performDownload, exportCsv, exportTxt, exportTxtEnglishOnly, chooseImportFile, handleFileImport, readAndImportFile, parseAndImport, openAiSuggestion, ref: vue.ref, computed: vue.computed, get onShow() {
        return onShow;
      }, get onUnload() {
        return onUnload;
      }, get db() {
        return db;
      }, get aiService() {
        return aiService;
      }, get getWordBriefBatch() {
        return getWordBriefBatch;
      }, get getLocalWordSnapshot() {
        return getLocalWordSnapshot;
      }, get getCurrentWordbook() {
        return getCurrentWordbook;
      }, get getWordbookListForUI() {
        return getWordbookListForUI;
      }, get setCurrentWordbook() {
        return setCurrentWordbook;
      }, get isLocalWordbookKey() {
        return isLocalWordbookKey;
      }, get loadLocalWordbook() {
        return loadLocalWordbook;
      }, get getWordbookWords() {
        return getWordbookWords;
      }, get getLearningDashboard() {
        return getLearningDashboard;
      }, get getStudyStats() {
        return getStudyStats;
      }, get getLatestSession() {
        return getLatestSession;
      }, get logger() {
        return logger;
      }, get cleanupExpiredCaches() {
        return cleanupExpiredCaches;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "status-bar" }),
      vue.createElementVNode("view", { class: "user-card" }, [
        vue.createElementVNode("view", { class: "user-section" }, [
          vue.createElementVNode("view", { class: "avatar" }, [
            vue.createElementVNode(
              "text",
              { class: "avatar-text" },
              vue.toDisplayString($setup.userInitial),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "user-info" }, [
            vue.createElementVNode(
              "text",
              { class: "username" },
              vue.toDisplayString($setup.displayName),
              1
              /* TEXT */
            ),
            vue.createElementVNode(
              "text",
              { class: "status" },
              vue.toDisplayString($setup.isLoggedIn ? "已登录" : "点击下方按钮登录"),
              1
              /* TEXT */
            ),
            $setup.isLoggedIn ? (vue.openBlock(), vue.createElementBlock("text", {
              key: 0,
              class: "edit-name-btn",
              onClick: vue.withModifiers($setup.goToEditNickname, ["stop"])
            }, "编辑昵称")) : vue.createCommentVNode("v-if", true)
          ])
        ]),
        !$setup.isLoggedIn ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "login-section"
        }, [
          vue.createElementVNode("button", {
            class: "login-btn",
            onClick: $setup.goToLogin
          }, "登录 / 注册")
        ])) : vue.createCommentVNode("v-if", true)
      ]),
      vue.createElementVNode("view", {
        class: "card wordbook-card",
        onClick: $setup.goToWordbookList
      }, [
        vue.createElementVNode("view", { class: "card-title" }, "当前单词本"),
        vue.createElementVNode("view", { class: "sync-list" }, [
          vue.createElementVNode("view", { class: "sync-item" }, [
            vue.createElementVNode(
              "text",
              { class: "sync-item-text" },
              vue.toDisplayString($setup.currentWordbookLabel),
              1
              /* TEXT */
            ),
            vue.createElementVNode("text", { class: "sync-item-arrow" }, "→")
          ])
        ]),
        vue.createElementVNode("view", { class: "sync-info" }, [
          vue.createElementVNode("text", { class: "info-text" }, "首页与复习将使用所选单词本，轻按可切换")
        ])
      ]),
      vue.createElementVNode("view", { class: "card learning-center-card" }, [
        vue.createElementVNode("view", { class: "card-title" }, "学习中心"),
        vue.createElementVNode("view", { class: "report-stats" }, [
          vue.createElementVNode(
            "text",
            { class: "info-text" },
            "今日到期 " + vue.toDisplayString($setup.learningSnapshot.dueCount) + " 个 · 错词 " + vue.toDisplayString($setup.learningSnapshot.mistakeCount) + " 个",
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "text",
            { class: "info-text" },
            "首日巩固 " + vue.toDisplayString($setup.learningSnapshot.firstDayDue) + " 个 · 连续学习 " + vue.toDisplayString($setup.studyStats.streak || 0) + " 天",
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "sync-list" }, [
          vue.createElementVNode("view", {
            class: "sync-item",
            onClick: $setup.goToStats
          }, [
            vue.createElementVNode("text", { class: "sync-item-text" }, "查看学习统计"),
            vue.createElementVNode("text", { class: "sync-item-arrow" }, "→")
          ]),
          vue.createElementVNode("view", {
            class: "sync-item",
            onClick: $setup.goToMistakes
          }, [
            vue.createElementVNode("text", { class: "sync-item-text" }, "打开错词本"),
            vue.createElementVNode("text", { class: "sync-item-arrow" }, "→")
          ]),
          vue.createElementVNode("view", {
            class: "sync-item",
            onClick: $setup.goToMasteredWords
          }, [
            vue.createElementVNode("text", { class: "sync-item-text" }, "已斩单词本"),
            vue.createElementVNode("text", { class: "sync-item-arrow" }, "→")
          ]),
          vue.createElementVNode("view", {
            class: "sync-item",
            onClick: $setup.goToDueReview
          }, [
            vue.createElementVNode("text", { class: "sync-item-text" }, "开始到期复习"),
            vue.createElementVNode("text", { class: "sync-item-arrow" }, "→")
          ])
        ])
      ]),
      $setup.isLoggedIn ? (vue.openBlock(), vue.createElementBlock("view", { key: 0 }, [
        vue.createElementVNode("view", { class: "card cloud-card" }, [
          vue.createElementVNode("view", { class: "card-title" }, "云端数据"),
          vue.createElementVNode("view", { class: "sync-list" }, [
            vue.createElementVNode("view", {
              class: "sync-item",
              onClick: $setup.uploadToCloud
            }, [
              vue.createElementVNode("text", { class: "sync-item-text" }, "备份到云端"),
              vue.createElementVNode("text", { class: "sync-item-arrow" }, "→")
            ]),
            vue.createElementVNode("view", {
              class: "sync-item",
              onClick: $setup.downloadFromCloud
            }, [
              vue.createElementVNode("text", { class: "sync-item-text" }, "从云端恢复"),
              vue.createElementVNode("text", { class: "sync-item-arrow" }, "→")
            ])
          ]),
          vue.createElementVNode("view", { class: "sync-info" }, [
            vue.createElementVNode(
              "text",
              { class: "info-text" },
              "本地单词数: " + vue.toDisplayString($setup.localWordCount),
              1
              /* TEXT */
            )
          ])
        ]),
        vue.createElementVNode("view", { class: "card local-data-card" }, [
          vue.createElementVNode("view", { class: "card-title" }, "本地数据"),
          vue.createElementVNode("view", { class: "sync-list" }, [
            vue.createElementVNode("view", {
              class: "sync-item",
              onClick: $setup.exportCsv
            }, [
              vue.createElementVNode("text", { class: "sync-item-text" }, "导出为 CSV"),
              vue.createElementVNode("text", { class: "sync-item-arrow" }, "→")
            ]),
            vue.createElementVNode("view", {
              class: "sync-item",
              onClick: $setup.exportTxt
            }, [
              vue.createElementVNode("text", { class: "sync-item-text" }, "导出为 TXT"),
              vue.createElementVNode("text", { class: "sync-item-arrow" }, "→")
            ]),
            vue.createElementVNode("view", {
              class: "sync-item",
              onClick: $setup.exportTxtEnglishOnly
            }, [
              vue.createElementVNode("text", { class: "sync-item-text" }, "仅导出英文"),
              vue.createElementVNode("text", { class: "sync-item-arrow" }, "→")
            ]),
            vue.createElementVNode("view", {
              class: "sync-item",
              onClick: $setup.chooseImportFile
            }, [
              vue.createElementVNode("text", { class: "sync-item-text" }, "从 CSV/TXT 导入"),
              vue.createElementVNode("text", { class: "sync-item-arrow" }, "→")
            ])
          ])
        ]),
        vue.createElementVNode("view", { class: "card report-card" }, [
          vue.createElementVNode("view", { class: "card-title" }, "学习报告"),
          vue.createElementVNode("view", { class: "report-stats" }, [
            vue.createElementVNode(
              "text",
              { class: "info-text" },
              "总词数 " + vue.toDisplayString($setup.localWordCount) + " · 累计查看 " + vue.toDisplayString($setup.totalViewCount) + " 次",
              1
              /* TEXT */
            ),
            $setup.lastReviewAccuracy !== null ? (vue.openBlock(), vue.createElementBlock(
              "text",
              {
                key: 0,
                class: "info-text"
              },
              "上次复习正确率 " + vue.toDisplayString($setup.lastReviewAccuracy) + "%",
              1
              /* TEXT */
            )) : vue.createCommentVNode("v-if", true)
          ]),
          vue.createElementVNode("view", { class: "sync-list" }, [
            vue.createElementVNode("view", {
              class: "sync-item",
              onClick: $setup.openAiSuggestion
            }, [
              vue.createElementVNode("text", { class: "sync-item-text" }, "查看 AI 复习建议"),
              vue.createElementVNode("text", { class: "sync-item-arrow" }, "→")
            ])
          ])
        ]),
        vue.createElementVNode("view", { class: "logout-section" }, [
          vue.createElementVNode("text", {
            class: "logout-text",
            onClick: $setup.handleLogout
          }, "退出登录")
        ])
      ])) : vue.createCommentVNode("v-if", true),
      !$setup.isLoggedIn ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "card local-data-card"
      }, [
        vue.createElementVNode("view", { class: "card-title" }, "本地数据"),
        vue.createElementVNode("view", { class: "sync-list" }, [
          vue.createElementVNode("view", {
            class: "sync-item",
            onClick: $setup.exportCsv
          }, [
            vue.createElementVNode("text", { class: "sync-item-text" }, "导出为 CSV"),
            vue.createElementVNode("text", { class: "sync-item-arrow" }, "→")
          ]),
          vue.createElementVNode("view", {
            class: "sync-item",
            onClick: $setup.exportTxt
          }, [
            vue.createElementVNode("text", { class: "sync-item-text" }, "导出为 TXT"),
            vue.createElementVNode("text", { class: "sync-item-arrow" }, "→")
          ]),
          vue.createElementVNode("view", {
            class: "sync-item",
            onClick: $setup.exportTxtEnglishOnly
          }, [
            vue.createElementVNode("text", { class: "sync-item-text" }, "仅导出英文"),
            vue.createElementVNode("text", { class: "sync-item-arrow" }, "→")
          ]),
          vue.createElementVNode("view", {
            class: "sync-item",
            onClick: $setup.chooseImportFile
          }, [
            vue.createElementVNode("text", { class: "sync-item-text" }, "从 CSV/TXT 导入"),
            vue.createElementVNode("text", { class: "sync-item-arrow" }, "→")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      !$setup.isLoggedIn ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 2,
        class: "card report-card"
      }, [
        vue.createElementVNode("view", { class: "card-title" }, "学习报告"),
        vue.createElementVNode("view", { class: "report-stats" }, [
          vue.createElementVNode(
            "text",
            { class: "info-text" },
            "总词数 " + vue.toDisplayString($setup.localWordCount) + " · 累计查看 " + vue.toDisplayString($setup.totalViewCount) + " 次",
            1
            /* TEXT */
          ),
          $setup.lastReviewAccuracy !== null ? (vue.openBlock(), vue.createElementBlock(
            "text",
            {
              key: 0,
              class: "info-text"
            },
            "上次复习正确率 " + vue.toDisplayString($setup.lastReviewAccuracy) + "%",
            1
            /* TEXT */
          )) : vue.createCommentVNode("v-if", true)
        ]),
        vue.createElementVNode("view", { class: "sync-list" }, [
          vue.createElementVNode("view", {
            class: "sync-item",
            onClick: $setup.openAiSuggestion
          }, [
            vue.createElementVNode("text", { class: "sync-item-text" }, "查看 AI 复习建议"),
            vue.createElementVNode("text", { class: "sync-item-arrow" }, "→")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      $setup.showAiSuggestionModal ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 3,
        class: "modal-overlay",
        onClick: _cache[2] || (_cache[2] = vue.withModifiers(($event) => $setup.showAiSuggestionModal = false, ["self"]))
      }, [
        vue.createElementVNode("view", {
          class: "report-modal",
          onClick: _cache[1] || (_cache[1] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode("view", { class: "modal-title" }, "学习报告"),
          vue.createElementVNode("scroll-view", {
            "scroll-y": "",
            class: "report-content"
          }, [
            vue.createElementVNode("view", { class: "report-section" }, [
              vue.createElementVNode("view", { class: "report-section-title" }, "一、学习数据"),
              vue.createElementVNode("view", { class: "report-stats-block" }, [
                vue.createElementVNode(
                  "view",
                  { class: "report-stat-row" },
                  "总词数：" + vue.toDisplayString($setup.localWordCount),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "view",
                  { class: "report-stat-row" },
                  "累计查看：" + vue.toDisplayString($setup.totalViewCount) + " 次",
                  1
                  /* TEXT */
                ),
                $setup.lastReviewAccuracy !== null ? (vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: 0,
                    class: "report-stat-row"
                  },
                  "上次复习正确率：" + vue.toDisplayString($setup.lastReviewAccuracy) + "%",
                  1
                  /* TEXT */
                )) : vue.createCommentVNode("v-if", true),
                $setup.lastReviewResult ? (vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: 1,
                    class: "report-stat-row"
                  },
                  "上次正确 " + vue.toDisplayString($setup.lastReviewResult.correctCount || 0) + " 题，错误 " + vue.toDisplayString($setup.lastReviewResult.wrongCount || 0) + " 题",
                  1
                  /* TEXT */
                )) : vue.createCommentVNode("v-if", true)
              ]),
              $setup.lastReviewResult && $setup.lastReviewResult.wrongWords && $setup.lastReviewResult.wrongWords.length ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "report-wrong-section"
              }, [
                vue.createElementVNode(
                  "view",
                  { class: "report-wrong-title" },
                  "上次错误单词（" + vue.toDisplayString($setup.lastReviewResult.wrongWords.length) + "）",
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("view", { class: "report-wrong-list" }, [
                  (vue.openBlock(true), vue.createElementBlock(
                    vue.Fragment,
                    null,
                    vue.renderList($setup.lastReviewResult.wrongWords, (w2, i2) => {
                      return vue.openBlock(), vue.createElementBlock(
                        "view",
                        {
                          key: i2,
                          class: "report-wrong-item"
                        },
                        vue.toDisplayString(w2.english) + " — " + vue.toDisplayString(w2.chinese),
                        1
                        /* TEXT */
                      );
                    }),
                    128
                    /* KEYED_FRAGMENT */
                  ))
                ])
              ])) : vue.createCommentVNode("v-if", true)
            ]),
            vue.createElementVNode("view", { class: "report-section" }, [
              vue.createElementVNode("view", { class: "report-section-title" }, "二、AI 复习建议"),
              vue.createElementVNode(
                "text",
                { class: "suggestion-text" },
                vue.toDisplayString($setup.aiSuggestionText || "加载中..."),
                1
                /* TEXT */
              )
            ])
          ]),
          vue.createElementVNode("button", {
            class: "modal-close-btn",
            onClick: _cache[0] || (_cache[0] = ($event) => $setup.showAiSuggestionModal = false)
          }, "关闭")
        ])
      ])) : vue.createCommentVNode("v-if", true),
      $setup.showImportModal ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 4,
        class: "modal-overlay",
        onClick: _cache[5] || (_cache[5] = vue.withModifiers(($event) => $setup.showImportModal = false, ["self"]))
      }, [
        vue.createElementVNode("view", {
          class: "import-modal",
          onClick: _cache[4] || (_cache[4] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode("view", { class: "modal-title" }, "导入单词"),
          vue.createElementVNode("scroll-view", {
            "scroll-y": "",
            class: "import-content"
          }, [
            vue.createElementVNode("view", { class: "import-section" }, [
              vue.createElementVNode("view", { class: "import-section-title" }, "📋 支持格式"),
              vue.createElementVNode("view", { class: "format-card" }, [
                vue.createElementVNode("view", { class: "format-name" }, "纯英文单词列表（推荐）"),
                vue.createElementVNode("view", { class: "format-example" }, "abandon achieve academic accomplish"),
                vue.createElementVNode("view", { class: "format-note" }, "每行一个单词，释义和例句会自动补全")
              ]),
              vue.createElementVNode("view", { class: "format-card" }, [
                vue.createElementVNode("view", { class: "format-name" }, "CSV 格式"),
                vue.createElementVNode("view", { class: "format-example" }, "abandon achieve academic"),
                vue.createElementVNode("view", { class: "format-note" }, "只需要第一列英文单词，其他列会被忽略")
              ]),
              vue.createElementVNode("view", { class: "format-card" }, [
                vue.createElementVNode("view", { class: "format-name" }, "TXT 格式（Tab 分隔）"),
                vue.createElementVNode("view", { class: "format-example" }, "abandon 放弃 achieve 实现"),
                vue.createElementVNode("view", { class: "format-note" }, "只需要第一列英文单词，其他列会被忽略")
              ])
            ]),
            vue.createElementVNode("view", { class: "import-section" }, [
              vue.createElementVNode("view", { class: "import-section-title" }, "💡 导入步骤"),
              vue.createElementVNode("view", { class: "step-list" }, [
                vue.createElementVNode("view", { class: "step-item" }, [
                  vue.createElementVNode("view", { class: "step-number" }, "1"),
                  vue.createElementVNode("view", { class: "step-text" }, "准备好 CSV 或 TXT 文件")
                ]),
                vue.createElementVNode("view", { class: "step-item" }, [
                  vue.createElementVNode("view", { class: "step-number" }, "2"),
                  vue.createElementVNode("view", { class: "step-text" }, "复制文件内容到剪贴板")
                ]),
                vue.createElementVNode("view", { class: "step-item" }, [
                  vue.createElementVNode("view", { class: "step-number" }, "3"),
                  vue.createElementVNode("view", { class: "step-text" }, '点击下方"开始导入"按钮')
                ])
              ])
            ]),
            vue.createElementVNode("view", { class: "import-tips" }, [
              vue.createElementVNode("text", { class: "tips-icon" }, "✨"),
              vue.createElementVNode("text", { class: "tips-text" }, "只需提供英文单词，释义、例句、近义词等信息会自动从本地数据库补全")
            ])
          ]),
          vue.createElementVNode("view", { class: "modal-actions" }, [
            vue.createElementVNode("button", {
              class: "modal-btn cancel",
              onClick: _cache[3] || (_cache[3] = ($event) => $setup.showImportModal = false)
            }, "取消"),
            vue.createElementVNode("button", {
              class: "modal-btn confirm",
              onClick: $setup.handleFileImport
            }, "开始导入")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesMyMy = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$6], ["__scopeId", "data-v-2f1ef635"], ["__file", "E:/vocal/wordbook_new/pages/my/my.vue"]]);
  const _sfc_main$5 = {
    __name: "edit-nickname",
    setup(__props, { expose: __expose }) {
      __expose();
      const nickname = vue.ref("");
      vue.onMounted(() => {
        const name = uni.getStorageSync("userDisplayName") || uni.getStorageSync("username") || "";
        nickname.value = (name || "").trim();
      });
      const save = async () => {
        const name = (nickname.value || "").trim();
        if (!name) {
          uni.showToast({ title: "请输入昵称", icon: "none" });
          return;
        }
        uni.setStorageSync("userDisplayName", name);
        try {
          const uid = uni.getStorageSync("uid");
          if (uid) {
            await tr.callFunction({
              name: "user-center",
              data: {
                action: "updateProfile",
                uid,
                displayName: name
              }
            });
          }
        } catch (e2) {
          formatAppLog("error", "at pages/my/edit-nickname.vue:62", "上传昵称到云端失败:", e2);
        }
        uni.showToast({ title: "昵称已保存", duration: 1500 });
        setTimeout(() => uni.navigateBack(), 300);
      };
      const __returned__ = { nickname, save, ref: vue.ref, onMounted: vue.onMounted };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page" }, [
      vue.createElementVNode("view", { class: "status-bar" }),
      vue.createElementVNode("view", { class: "content-wrapper" }, [
        vue.createElementVNode("view", { class: "form" }, [
          vue.createElementVNode("text", { class: "label" }, "昵称"),
          vue.createElementVNode("view", { class: "input-wrapper" }, [
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.nickname = $event),
                class: "nickname-input",
                type: "text",
                placeholder: "请输入昵称",
                maxlength: "20",
                focus: true,
                "adjust-position": true,
                "confirm-type": "done"
              },
              null,
              512
              /* NEED_PATCH */
            ), [
              [vue.vModelText, $setup.nickname]
            ])
          ]),
          vue.createElementVNode("text", { class: "hint" }, "保存后将在「我的」页显示，最多 20 字")
        ]),
        vue.createElementVNode("button", {
          class: "btn-save",
          onClick: $setup.save
        }, "保存")
      ])
    ]);
  }
  const PagesMyEditNickname = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$5], ["__scopeId", "data-v-1c19f9a5"], ["__file", "E:/vocal/wordbook_new/pages/my/edit-nickname.vue"]]);
  const _sfc_main$4 = {
    __name: "wordbook-list",
    setup(__props, { expose: __expose }) {
      __expose();
      const list = vue.ref([]);
      const counts = vue.ref({});
      const currentId = vue.ref("");
      const showNewModal = vue.ref(false);
      const newName = vue.ref("");
      const loadList = () => {
        list.value = getWordbookListForUI();
        currentId.value = getCurrentWordbook();
      };
      const getCount = (item) => {
        if (counts.value[item.id] !== void 0)
          return counts.value[item.id];
        if (item.id === "self")
          return counts.value["self"] ?? "—";
        if (item.isLocal)
          return counts.value[item.id] ?? "—";
        const n2 = (getWordbookWords(item.id) || []).length;
        counts.value[item.id] = n2;
        return n2;
      };
      const loadCounts = async () => {
        const next = {};
        for (const item of list.value) {
          if (item.id === "self") {
            const words = await db.getWords();
            next["self"] = words.length;
          } else if (item.isLocal) {
            const arr = await loadLocalWordbook(item.id);
            next[item.id] = arr.length;
          } else {
            next[item.id] = (getWordbookWords(item.id) || []).length;
          }
        }
        counts.value = next;
      };
      const onSelect = (item) => {
        setCurrentWordbook(item.id);
        uni.$emit("wordbookChanged", item.id);
        uni.showToast({ title: "已切换为 " + item.name, icon: "none" });
        uni.navigateBack();
      };
      const onDelete = (item) => {
        if (!item.canDelete)
          return;
        uni.showModal({
          title: "删除单词本",
          content: "确定删除「" + item.name + "」吗？其中的单词将一并删除。",
          success: (res) => {
            if (res.confirm) {
              removeCloudWordbook(item.id);
              if (currentId.value === item.id) {
                setCurrentWordbook("self");
                uni.$emit("wordbookChanged", "self");
              }
              loadList();
              loadCounts();
              uni.showToast({ title: "已删除", icon: "none" });
            }
          }
        });
      };
      const onConfirmNew = () => {
        const name = (newName.value || "").trim();
        if (!name) {
          uni.showToast({ title: "请输入名称", icon: "none" });
          return;
        }
        const id = addCloudWordbook(name);
        setCurrentWordbook(id);
        uni.$emit("wordbookChanged", id);
        newName.value = "";
        showNewModal.value = false;
        loadList();
        loadCounts();
        uni.showToast({ title: "已创建并切换", icon: "none" });
      };
      vue.onMounted(() => {
        loadList();
        loadCounts();
      });
      onUnload(() => {
        try {
          cleanupExpiredCaches();
        } catch (error) {
          logger.warn("WordbookList", "清理缓存失败", error);
        }
      });
      const __returned__ = { list, counts, currentId, showNewModal, newName, loadList, getCount, loadCounts, onSelect, onDelete, onConfirmNew, ref: vue.ref, computed: vue.computed, onMounted: vue.onMounted, get onUnload() {
        return onUnload;
      }, get db() {
        return db;
      }, get getWordbookListForUI() {
        return getWordbookListForUI;
      }, get getCurrentWordbook() {
        return getCurrentWordbook;
      }, get setCurrentWordbook() {
        return setCurrentWordbook;
      }, get addCloudWordbook() {
        return addCloudWordbook;
      }, get removeCloudWordbook() {
        return removeCloudWordbook;
      }, get getWordbookWords() {
        return getWordbookWords;
      }, get isLocalWordbookKey() {
        return isLocalWordbookKey;
      }, get loadLocalWordbook() {
        return loadLocalWordbook;
      }, get logger() {
        return logger;
      }, get cleanupExpiredCaches() {
        return cleanupExpiredCaches;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "status-bar" }),
      vue.createElementVNode(
        "view",
        { class: "list-title" },
        "单词本 (" + vue.toDisplayString($setup.list.length) + "/" + vue.toDisplayString($setup.list.length) + ")",
        1
        /* TEXT */
      ),
      vue.createElementVNode("view", { class: "list-content" }, [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($setup.list, (item) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              key: item.id,
              class: vue.normalizeClass(["wordbook-card", { selected: $setup.currentId === item.id }]),
              onClick: ($event) => $setup.onSelect(item)
            }, [
              vue.createElementVNode("view", { class: "card-left" }, [
                vue.createElementVNode(
                  "view",
                  { class: "card-icon" },
                  vue.toDisplayString((item.name || "本").charAt(0)),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("view", { class: "card-info" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "card-name" },
                    vue.toDisplayString(item.name),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "card-count" },
                    "共 " + vue.toDisplayString($setup.getCount(item)) + " 词",
                    1
                    /* TEXT */
                  )
                ])
              ]),
              item.canDelete ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "card-delete",
                onClick: vue.withModifiers(($event) => $setup.onDelete(item), ["stop"])
              }, [
                vue.createElementVNode("text", { class: "delete-text" }, "删除")
              ], 8, ["onClick"])) : vue.createCommentVNode("v-if", true)
            ], 10, ["onClick"]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ]),
      vue.createElementVNode("view", { class: "footer-btn-wrap" }, [
        vue.createElementVNode("button", {
          class: "btn-new",
          onClick: _cache[0] || (_cache[0] = ($event) => $setup.showNewModal = true)
        }, "新建单词本")
      ]),
      $setup.showNewModal ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "modal-overlay",
        onClick: _cache[4] || (_cache[4] = vue.withModifiers(($event) => $setup.showNewModal = false, ["self"]))
      }, [
        vue.createElementVNode("view", {
          class: "modal-box",
          onClick: _cache[3] || (_cache[3] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode("view", { class: "modal-title" }, "新建单词本"),
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $setup.newName = $event),
              class: "modal-input",
              placeholder: "输入单词本名称",
              focus: ""
            },
            null,
            512
            /* NEED_PATCH */
          ), [
            [vue.vModelText, $setup.newName]
          ]),
          vue.createElementVNode("view", { class: "modal-actions" }, [
            vue.createElementVNode("button", {
              class: "modal-btn cancel",
              onClick: _cache[2] || (_cache[2] = ($event) => $setup.showNewModal = false)
            }, "取消"),
            vue.createElementVNode("button", {
              class: "modal-btn confirm",
              onClick: $setup.onConfirmNew
            }, "确定")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesWordbookListWordbookList = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$4], ["__scopeId", "data-v-887913bf"], ["__file", "E:/vocal/wordbook_new/pages/wordbook-list/wordbook-list.vue"]]);
  const _sfc_main$3 = {
    __name: "stats",
    setup(__props, { expose: __expose }) {
      __expose();
      const stats = vue.ref({
        dueCount: 0,
        mistakeCount: 0,
        reviewedCount: 0,
        streak: 0,
        masteryBuckets: { strong: 0, normal: 0, weak: 0, danger: 0 }
      });
      const trend = vue.ref([]);
      const currentBookLabel = vue.computed(() => getCurrentWordbook() || "当前词书");
      const getWordPool = async () => {
        const book = getCurrentWordbook();
        if (book === "self")
          return await db.getAllWords();
        if (isLocalWordbookKey(book))
          return await loadLocalWordbook(book);
        return getWordbookWords(book) || [];
      };
      const loadStats = async () => {
        const words = await getWordPool();
        const result = getStudyStats(words, getCurrentWordbook());
        stats.value = result;
        trend.value = Array.isArray(result.trend) ? result.trend : [];
      };
      const getAccuracy = (item) => {
        const total = Number(item.reviewedCount || 0);
        if (!total)
          return 0;
        return Math.round(Number(item.correctCount || 0) / total * 100);
      };
      const getBucketPercent = (key) => {
        const b2 = stats.value.masteryBuckets;
        if (!b2)
          return 0;
        const total = (b2.strong || 0) + (b2.normal || 0) + (b2.weak || 0) + (b2.danger || 0);
        if (!total)
          return 0;
        return Math.round((b2[key] || 0) / total * 100);
      };
      const goToReview = (preset) => {
        uni.navigateTo({ url: `/pages/review/review?preset=${encodeURIComponent(preset)}` });
      };
      onShow(() => {
        loadStats();
      });
      onUnload(() => {
        try {
          cleanupExpiredCaches();
        } catch (error) {
          logger.warn("Stats", "清理缓存失败", error);
        }
      });
      const __returned__ = { stats, trend, currentBookLabel, getWordPool, loadStats, getAccuracy, getBucketPercent, goToReview, ref: vue.ref, computed: vue.computed, get onShow() {
        return onShow;
      }, get onUnload() {
        return onUnload;
      }, get db() {
        return db;
      }, get getCurrentWordbook() {
        return getCurrentWordbook;
      }, get isLocalWordbookKey() {
        return isLocalWordbookKey;
      }, get loadLocalWordbook() {
        return loadLocalWordbook;
      }, get getWordbookWords() {
        return getWordbookWords;
      }, get getStudyStats() {
        return getStudyStats;
      }, get logger() {
        return logger;
      }, get cleanupExpiredCaches() {
        return cleanupExpiredCaches;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    var _a, _b, _c, _d;
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "status-bar" }),
      vue.createElementVNode("view", { class: "card" }, [
        vue.createElementVNode("view", { class: "card-title" }, "当前词书"),
        vue.createElementVNode(
          "view",
          { class: "card-sub" },
          vue.toDisplayString($setup.currentBookLabel),
          1
          /* TEXT */
        ),
        vue.createElementVNode("view", { class: "summary-grid" }, [
          vue.createElementVNode("view", { class: "summary-item" }, [
            vue.createElementVNode(
              "text",
              { class: "summary-value" },
              vue.toDisplayString($setup.stats.dueCount || 0),
              1
              /* TEXT */
            ),
            vue.createElementVNode("text", { class: "summary-label" }, "今日到期")
          ]),
          vue.createElementVNode("view", { class: "summary-item" }, [
            vue.createElementVNode(
              "text",
              { class: "summary-value" },
              vue.toDisplayString($setup.stats.mistakeCount || 0),
              1
              /* TEXT */
            ),
            vue.createElementVNode("text", { class: "summary-label" }, "错词待练")
          ]),
          vue.createElementVNode("view", { class: "summary-item" }, [
            vue.createElementVNode(
              "text",
              { class: "summary-value" },
              vue.toDisplayString($setup.stats.reviewedCount || 0),
              1
              /* TEXT */
            ),
            vue.createElementVNode("text", { class: "summary-label" }, "已建档词")
          ]),
          vue.createElementVNode("view", { class: "summary-item" }, [
            vue.createElementVNode(
              "text",
              { class: "summary-value" },
              vue.toDisplayString($setup.stats.streak || 0),
              1
              /* TEXT */
            ),
            vue.createElementVNode("text", { class: "summary-label" }, "连续学习")
          ])
        ])
      ]),
      vue.createElementVNode("view", { class: "card" }, [
        vue.createElementVNode("view", { class: "card-title" }, "掌握度分层"),
        vue.createElementVNode("view", { class: "bucket-list" }, [
          vue.createElementVNode("view", { class: "bucket-item bucket-strong" }, [
            vue.createElementVNode("view", { class: "bucket-left" }, [
              vue.createElementVNode("text", { class: "bucket-dot dot-strong" }, "●"),
              vue.createElementVNode("text", { class: "bucket-name" }, "熟练")
            ]),
            vue.createElementVNode("view", { class: "bucket-right" }, [
              vue.createElementVNode("view", { class: "bucket-bar-bg" }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: "bucket-bar-fill bar-strong",
                    style: vue.normalizeStyle({ width: $setup.getBucketPercent("strong") + "%" })
                  },
                  null,
                  4
                  /* STYLE */
                )
              ]),
              vue.createElementVNode(
                "text",
                { class: "bucket-count" },
                vue.toDisplayString(((_a = $setup.stats.masteryBuckets) == null ? void 0 : _a.strong) || 0),
                1
                /* TEXT */
              )
            ])
          ]),
          vue.createElementVNode("view", { class: "bucket-item bucket-normal" }, [
            vue.createElementVNode("view", { class: "bucket-left" }, [
              vue.createElementVNode("text", { class: "bucket-dot dot-normal" }, "●"),
              vue.createElementVNode("text", { class: "bucket-name" }, "稳定")
            ]),
            vue.createElementVNode("view", { class: "bucket-right" }, [
              vue.createElementVNode("view", { class: "bucket-bar-bg" }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: "bucket-bar-fill bar-normal",
                    style: vue.normalizeStyle({ width: $setup.getBucketPercent("normal") + "%" })
                  },
                  null,
                  4
                  /* STYLE */
                )
              ]),
              vue.createElementVNode(
                "text",
                { class: "bucket-count" },
                vue.toDisplayString(((_b = $setup.stats.masteryBuckets) == null ? void 0 : _b.normal) || 0),
                1
                /* TEXT */
              )
            ])
          ]),
          vue.createElementVNode("view", { class: "bucket-item bucket-weak" }, [
            vue.createElementVNode("view", { class: "bucket-left" }, [
              vue.createElementVNode("text", { class: "bucket-dot dot-weak" }, "●"),
              vue.createElementVNode("text", { class: "bucket-name" }, "薄弱")
            ]),
            vue.createElementVNode("view", { class: "bucket-right" }, [
              vue.createElementVNode("view", { class: "bucket-bar-bg" }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: "bucket-bar-fill bar-weak",
                    style: vue.normalizeStyle({ width: $setup.getBucketPercent("weak") + "%" })
                  },
                  null,
                  4
                  /* STYLE */
                )
              ]),
              vue.createElementVNode(
                "text",
                { class: "bucket-count" },
                vue.toDisplayString(((_c = $setup.stats.masteryBuckets) == null ? void 0 : _c.weak) || 0),
                1
                /* TEXT */
              )
            ])
          ]),
          vue.createElementVNode("view", { class: "bucket-item bucket-danger" }, [
            vue.createElementVNode("view", { class: "bucket-left" }, [
              vue.createElementVNode("text", { class: "bucket-dot dot-danger" }, "●"),
              vue.createElementVNode("text", { class: "bucket-name" }, "危险")
            ]),
            vue.createElementVNode("view", { class: "bucket-right" }, [
              vue.createElementVNode("view", { class: "bucket-bar-bg" }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: "bucket-bar-fill bar-danger",
                    style: vue.normalizeStyle({ width: $setup.getBucketPercent("danger") + "%" })
                  },
                  null,
                  4
                  /* STYLE */
                )
              ]),
              vue.createElementVNode(
                "text",
                { class: "bucket-count" },
                vue.toDisplayString(((_d = $setup.stats.masteryBuckets) == null ? void 0 : _d.danger) || 0),
                1
                /* TEXT */
              )
            ])
          ])
        ])
      ]),
      vue.createElementVNode("view", { class: "card" }, [
        vue.createElementVNode("view", { class: "card-title" }, "近 7 天趋势"),
        $setup.trend.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "empty-text"
        }, "还没有形成学习记录")) : (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "trend-list"
        }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.trend, (item) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: item.day,
                class: "trend-item"
              }, [
                vue.createElementVNode("view", { class: "trend-meta" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "trend-day" },
                    vue.toDisplayString(item.day.slice(5)),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "trend-review" },
                    "复习 " + vue.toDisplayString(item.reviewedCount),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("view", { class: "trend-bar-wrap" }, [
                  vue.createElementVNode("view", { class: "trend-bar-bg" }, [
                    vue.createElementVNode(
                      "view",
                      {
                        class: "trend-bar-fill",
                        style: vue.normalizeStyle({ width: $setup.getAccuracy(item) + "%" })
                      },
                      null,
                      4
                      /* STYLE */
                    )
                  ]),
                  vue.createElementVNode(
                    "text",
                    { class: "trend-acc" },
                    vue.toDisplayString($setup.getAccuracy(item)) + "%",
                    1
                    /* TEXT */
                  )
                ])
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ]))
      ]),
      vue.createElementVNode("view", { class: "card" }, [
        vue.createElementVNode("view", { class: "card-title" }, "快速入口"),
        vue.createElementVNode("view", { class: "action-row" }, [
          vue.createElementVNode("button", {
            class: "pill-btn",
            onClick: _cache[0] || (_cache[0] = ($event) => $setup.goToReview("due"))
          }, "到期复习"),
          vue.createElementVNode("button", {
            class: "pill-btn secondary",
            onClick: _cache[1] || (_cache[1] = ($event) => $setup.goToReview("wrong"))
          }, "错词再练")
        ])
      ])
    ]);
  }
  const PagesStatsStats = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$3], ["__scopeId", "data-v-3598459f"], ["__file", "E:/vocal/wordbook_new/pages/stats/stats.vue"]]);
  const _sfc_main$2 = {
    __name: "mistakes",
    setup(__props, { expose: __expose }) {
      __expose();
      const mistakes = vue.ref([]);
      const currentBookLabel = vue.computed(() => getCurrentWordbook() || "当前词书");
      const loadMistakes = () => {
        mistakes.value = getMistakeWords(getCurrentWordbook(), true);
      };
      const formatTime = (time) => {
        if (!time)
          return "最近新增";
        const date = new Date(time);
        if (Number.isNaN(date.getTime()))
          return "最近新增";
        const m2 = `${date.getMonth() + 1}`.padStart(2, "0");
        const d2 = `${date.getDate()}`.padStart(2, "0");
        const h2 = `${date.getHours()}`.padStart(2, "0");
        const min = `${date.getMinutes()}`.padStart(2, "0");
        return `${m2}/${d2} ${h2}:${min}`;
      };
      const goToWrongReview = () => {
        uni.navigateTo({ url: "/pages/review/review?preset=wrong" });
      };
      const goToDetail = (item) => {
        if (!item || !item.english)
          return;
        uni.navigateTo({ url: `/pages/word-detail/word-detail?english=${encodeURIComponent(item.english)}&fromWordbook=1` });
      };
      const clearOne = (item) => {
        clearMistake(item.english);
        loadMistakes();
        uni.showToast({ title: "已从错词本移除", icon: "none" });
      };
      onShow(() => {
        loadMistakes();
      });
      onUnload(() => {
        try {
          cleanupExpiredCaches();
        } catch (error) {
          logger.warn("Mistakes", "清理缓存失败", error);
        }
      });
      const __returned__ = { mistakes, currentBookLabel, loadMistakes, formatTime, goToWrongReview, goToDetail, clearOne, ref: vue.ref, computed: vue.computed, get onShow() {
        return onShow;
      }, get onUnload() {
        return onUnload;
      }, get getCurrentWordbook() {
        return getCurrentWordbook;
      }, get getMistakeWords() {
        return getMistakeWords;
      }, get clearMistake() {
        return clearMistake;
      }, get logger() {
        return logger;
      }, get cleanupExpiredCaches() {
        return cleanupExpiredCaches;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "status-bar" }),
      vue.createElementVNode("view", { class: "card top-card" }, [
        vue.createElementVNode("view", null, [
          vue.createElementVNode("view", { class: "card-title" }, "错词本"),
          vue.createElementVNode(
            "view",
            { class: "card-sub" },
            "当前词书：" + vue.toDisplayString($setup.currentBookLabel),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("button", {
          class: "review-btn",
          onClick: $setup.goToWrongReview
        }, "开始再练")
      ]),
      $setup.mistakes.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "card empty-card"
      }, [
        vue.createElementVNode("text", { class: "empty-text" }, "当前没有待消灭的错词")
      ])) : vue.createCommentVNode("v-if", true),
      (vue.openBlock(true), vue.createElementBlock(
        vue.Fragment,
        null,
        vue.renderList($setup.mistakes, (item) => {
          return vue.openBlock(), vue.createElementBlock("view", {
            key: item.key,
            class: "card mistake-card"
          }, [
            vue.createElementVNode("view", { class: "mistake-head" }, [
              vue.createElementVNode("view", null, [
                vue.createElementVNode(
                  "text",
                  { class: "mistake-word" },
                  vue.toDisplayString(item.english),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "mistake-chi" },
                  vue.toDisplayString(item.chinese || "—"),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "mistake-meta" }, [
                vue.createElementVNode(
                  "text",
                  null,
                  "错 " + vue.toDisplayString(item.error_count || 0) + " 次",
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  null,
                  vue.toDisplayString($setup.formatTime(item.last_wrong_at)),
                  1
                  /* TEXT */
                )
              ])
            ]),
            vue.createElementVNode("view", { class: "action-row" }, [
              vue.createElementVNode("button", {
                class: "pill-btn secondary",
                onClick: ($event) => $setup.goToDetail(item)
              }, "查看详情", 8, ["onClick"]),
              vue.createElementVNode("button", {
                class: "pill-btn tertiary",
                onClick: ($event) => $setup.clearOne(item)
              }, "标记已掌握", 8, ["onClick"])
            ])
          ]);
        }),
        128
        /* KEYED_FRAGMENT */
      ))
    ]);
  }
  const PagesMistakesMistakes = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$2], ["__scopeId", "data-v-feb32a29"], ["__file", "E:/vocal/wordbook_new/pages/mistakes/mistakes.vue"]]);
  const _sfc_main$1 = {
    __name: "mastered-words",
    setup(__props, { expose: __expose }) {
      __expose();
      const masteredWords = vue.ref([]);
      const currentBookLabel = vue.computed(() => getCurrentWordbook() || "当前词书");
      const showUnmasterModal = vue.ref(false);
      const unmasterItem = vue.ref(null);
      const loadMasteredWords = async () => {
        try {
          const selfMastered = await db.getMasteredWords();
          const bookId = getCurrentWordbook();
          let wordbookMastered = [];
          if (bookId && bookId !== "self") {
            const masteredSet = getMasteredWordbookWords(bookId);
            const allWords = await getCurrentBookWordPool();
            wordbookMastered = (allWords || []).filter((w2) => masteredSet.has((w2.english || "").trim().toLowerCase())).map((w2) => ({
              english: w2.english,
              chinese: w2.chinese,
              mastered_at: (/* @__PURE__ */ new Date()).toISOString(),
              id: w2.id || `wordbook_${bookId}_${w2.english}`
            }));
          }
          masteredWords.value = [...selfMastered, ...wordbookMastered];
        } catch (error) {
          formatAppLog("error", "at pages/mastered-words/mastered-words.vue:105", "加载已斯单词失败:", error);
          masteredWords.value = [];
        }
      };
      const formatDate = (dateStr) => {
        if (!dateStr)
          return "—";
        try {
          const date = new Date(dateStr);
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const hour = String(date.getHours()).padStart(2, "0");
          const min = String(date.getMinutes()).padStart(2, "0");
          return `${month}/${day} ${hour}:${min}`;
        } catch (e2) {
          return "—";
        }
      };
      const getStreak = () => {
        if (masteredWords.value.length === 0)
          return 0;
        const dates = masteredWords.value.map((w2) => {
          if (!w2.mastered_at)
            return null;
          const date = new Date(w2.mastered_at);
          return date.toDateString();
        }).filter((d2) => d2 !== null);
        const uniqueDates = [...new Set(dates)].sort().reverse();
        if (uniqueDates.length === 0)
          return 0;
        let streak = 1;
        const today = (/* @__PURE__ */ new Date()).toDateString();
        if (uniqueDates[0] !== today) {
          const yesterday = /* @__PURE__ */ new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (uniqueDates[0] !== yesterday.toDateString()) {
            return 0;
          }
        }
        for (let i2 = 1; i2 < uniqueDates.length; i2++) {
          const prevDate = new Date(uniqueDates[i2 - 1]);
          const currDate = new Date(uniqueDates[i2]);
          const diffTime = prevDate - currDate;
          const diffDays = diffTime / (1e3 * 60 * 60 * 24);
          if (diffDays === 1) {
            streak++;
          } else {
            break;
          }
        }
        return streak;
      };
      const goToDetail = (item) => {
        if (!item || !item.english)
          return;
        uni.navigateTo({
          url: `/pages/word-detail/word-detail?english=${encodeURIComponent(item.english)}&fromWordbook=1`,
          fail: (err) => {
            formatAppLog("error", "at pages/mastered-words/mastered-words.vue:171", "跳转失败:", err);
            uni.showToast({ title: "跳转失败", icon: "none" });
          }
        });
      };
      const showUnmasterConfirm = (item) => {
        unmasterItem.value = item;
        showUnmasterModal.value = true;
      };
      const confirmUnmaster = async () => {
        if (!unmasterItem.value)
          return;
        try {
          const bookId = getCurrentWordbook();
          if (unmasterItem.value.id && unmasterItem.value.id.startsWith("wordbook_")) {
            removeMasteredWordbookWord(bookId, unmasterItem.value.english);
          } else if (unmasterItem.value.id) {
            await db.unmasterWord(unmasterItem.value.id);
          }
          uni.showToast({ title: "已取消斯掉", icon: "success" });
          showUnmasterModal.value = false;
          unmasterItem.value = null;
          await loadMasteredWords();
        } catch (error) {
          formatAppLog("error", "at pages/mastered-words/mastered-words.vue:201", "取消斯掉失败:", error);
          uni.showToast({ title: "操作失败", icon: "none" });
        }
      };
      const goToReview = () => {
        uni.navigateTo({
          url: "/pages/review/review?preset=all"
        });
      };
      onShow(() => {
        loadMasteredWords();
      });
      onUnload(() => {
        try {
          cleanupExpiredCaches();
        } catch (error) {
          logger.warn("MasteredWords", "清理缓存失败", error);
        }
      });
      const __returned__ = { masteredWords, currentBookLabel, showUnmasterModal, unmasterItem, loadMasteredWords, formatDate, getStreak, goToDetail, showUnmasterConfirm, confirmUnmaster, goToReview, ref: vue.ref, computed: vue.computed, get onShow() {
        return onShow;
      }, get onUnload() {
        return onUnload;
      }, get getCurrentWordbook() {
        return getCurrentWordbook;
      }, get db() {
        return db;
      }, get logger() {
        return logger;
      }, get cleanupExpiredCaches() {
        return cleanupExpiredCaches;
      }, get getMasteredWordbookWords() {
        return getMasteredWordbookWords;
      }, get removeMasteredWordbookWord() {
        return removeMasteredWordbookWord;
      }, get addMasteredWordbookWord() {
        return addMasteredWordbookWord;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    var _a, _b;
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "status-bar" }),
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("view", { class: "header-title" }, "已斯单词本"),
        vue.createElementVNode(
          "view",
          { class: "header-subtitle" },
          vue.toDisplayString($setup.currentBookLabel),
          1
          /* TEXT */
        )
      ]),
      $setup.masteredWords.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "empty-state"
      }, [
        vue.createElementVNode("view", { class: "empty-icon" }, "📚"),
        vue.createElementVNode("text", { class: "empty-title" }, "还没有斯掉任何单词"),
        vue.createElementVNode("text", { class: "empty-desc" }, "开始复习，掌握更多单词吧")
      ])) : (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "content"
      }, [
        vue.createElementVNode("view", { class: "section-label" }, "已斯统计"),
        vue.createElementVNode("view", { class: "card stat-card" }, [
          vue.createElementVNode("view", { class: "stat-row" }, [
            vue.createElementVNode("view", { class: "stat-item" }, [
              vue.createElementVNode(
                "view",
                { class: "stat-number" },
                vue.toDisplayString($setup.masteredWords.length),
                1
                /* TEXT */
              ),
              vue.createElementVNode("view", { class: "stat-text" }, "个单词")
            ]),
            vue.createElementVNode("view", { class: "stat-divider" }),
            vue.createElementVNode("view", { class: "stat-item" }, [
              vue.createElementVNode(
                "view",
                { class: "stat-number" },
                vue.toDisplayString($setup.getStreak()),
                1
                /* TEXT */
              ),
              vue.createElementVNode("view", { class: "stat-text" }, "连续天数")
            ])
          ])
        ]),
        vue.createElementVNode("view", { class: "section-label" }, "单词列表"),
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($setup.masteredWords, (item) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              key: item.id,
              class: "card word-card"
            }, [
              vue.createElementVNode("view", { class: "word-header" }, [
                vue.createElementVNode("view", { class: "word-info" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "word-english" },
                    vue.toDisplayString(item.english),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "word-chinese" },
                    vue.toDisplayString(item.chinese || "—"),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode(
                  "view",
                  { class: "word-date" },
                  vue.toDisplayString($setup.formatDate(item.mastered_at)),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "word-actions" }, [
                vue.createElementVNode("button", {
                  class: "action-btn detail-btn",
                  onClick: ($event) => $setup.goToDetail(item)
                }, "查看详情", 8, ["onClick"]),
                vue.createElementVNode("button", {
                  class: "action-btn unmaster-btn",
                  onClick: ($event) => $setup.showUnmasterConfirm(item)
                }, "取消斯掉", 8, ["onClick"])
              ])
            ]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ])),
      $setup.showUnmasterModal ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 2,
        class: "modal-overlay",
        onClick: _cache[2] || (_cache[2] = ($event) => $setup.showUnmasterModal = false)
      }, [
        vue.createElementVNode("view", {
          class: "modal-content",
          onClick: _cache[1] || (_cache[1] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode("text", { class: "modal-title" }, "取消斯掉？"),
          vue.createElementVNode(
            "text",
            { class: "modal-text" },
            vue.toDisplayString((_a = $setup.unmasterItem) == null ? void 0 : _a.english) + " - " + vue.toDisplayString((_b = $setup.unmasterItem) == null ? void 0 : _b.chinese),
            1
            /* TEXT */
          ),
          vue.createElementVNode("text", { class: "modal-hint" }, "取消后该单词将重新加入复习队列"),
          vue.createElementVNode("view", { class: "modal-actions" }, [
            vue.createElementVNode("button", {
              class: "modal-btn cancel-btn",
              onClick: _cache[0] || (_cache[0] = ($event) => $setup.showUnmasterModal = false)
            }, "保留"),
            vue.createElementVNode("button", {
              class: "modal-btn confirm-btn",
              onClick: $setup.confirmUnmaster
            }, "确认取消")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesMasteredWordsMasteredWords = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render$1], ["__scopeId", "data-v-aadbfca6"], ["__file", "E:/vocal/wordbook_new/pages/mastered-words/mastered-words.vue"]]);
  __definePage("pages/index/index", PagesIndexIndex);
  __definePage("pages/word-detail/word-detail", PagesWordDetailWordDetail);
  __definePage("pages/review/review", PagesReviewReview);
  __definePage("pages/quick-add/quick-add", PagesQuickAddQuickAdd);
  __definePage("pages/login/login", PagesLoginLogin);
  __definePage("pages/my/my", PagesMyMy);
  __definePage("pages/my/edit-nickname", PagesMyEditNickname);
  __definePage("pages/wordbook-list/wordbook-list", PagesWordbookListWordbookList);
  __definePage("pages/stats/stats", PagesStatsStats);
  __definePage("pages/mistakes/mistakes", PagesMistakesMistakes);
  __definePage("pages/mastered-words/mastered-words", PagesMasteredWordsMasteredWords);
  const _sfc_main = {
    name: "App",
    onLaunch() {
      formatAppLog("log", "at App.vue:9", "[App] onLaunch 被触发");
    },
    onShow() {
      formatAppLog("log", "at App.vue:12", "[App] onShow 被触发");
    },
    onHide() {
      formatAppLog("log", "at App.vue:15", "[App] onHide 被触发");
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("div", { id: "app" });
  }
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "E:/vocal/wordbook_new/App.vue"]]);
  function createApp(rootComponent, rootProps) {
    rootComponent.mpTye = "app";
    rootComponent.render = () => {
    };
    const app2 = vue.createVueApp(rootComponent, rootProps);
    app2.provide("__globalStyles", __uniConfig.styles);
    const oldMount = app2.mount;
    app2.mount = (container) => {
      const appVm = oldMount.call(app2, container);
      return appVm;
    };
    return app2;
  }
  const app = createApp(App);
  app.mount("#app");
})(Vue);
