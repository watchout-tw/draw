Vue.component('graph', {
  mixins: [mxGraph],
  created: function () {
    Promise.all([this.props.id].concat(!!this.props.compare ? this.props.compare.map(function (comp) {
      return comp.id;
    }) : []).map(function (id) {
      return Vue.http.get('./src/data/' + id + '.json');
    })).then(this.getSuccess, this.getError);
  },
  methods: {
    getSuccess: function (responses) {
      // process responses
      // use this.$set to enable change detection
      this.$set(this.rows, 'orig', responses.shift().body);
      this.$set(this.rows, 'user', JSON.parse(JSON.stringify(this.rows.orig)));
      this.rows.user.forEach(function (row, index, rows) {
        if (row.fix && !(index + 1 < rows.length && !rows[index + 1].fix)) row.show = false;
      });

      this.$set(this.rows, 'comp', responses.map(function (res) {
        return res.body.map(function (row) {
          row.show = true;
          row.fix = true;
          return row;
        });
      }));

      // draw
      this.init();
      this.draw();
    },
    getError: function (response) {
      console.error(response);
    },
    markdown: function (text) {
      return marked(text);
    }
  },
  template: '\n  <div class="graph" :id="props.id">\n    <div class="before textgroup">\n      <h2>{{ props.text.title }}</h2>\n      <div class="text a-text-only" v-html="markdown(props.text.before)"></div>\n    </div>\n    <div class="draw">\n      <div class="you-draw">\n        <div class="line"></div>\n        <div class="hand"></div>\n      </div>\n    </div>\n    <div class="after textgroup">\n      <div class="score d-flex justify-content-center align-items-center"><div>\u756B\u7684\u6709</div><div class="number">{{ score }}</div><div>\u5206\u50CF\u5462</div></div>\n      <div class="text a-text-only" v-html="markdown(props.text.after)"></div>\n    </div>\n  </div>\n  '
});

var app = new Vue({
  el: '#app',
  methods: {},
  data: {
    common: CommonData,
    graphs: graphs,
    header: {
      title: '蔡總統的第一年',
      description: '蔡英文政府已執政滿一週年，跟過去幾年相比，到底表現好不好呢？沃草透過比較從扁政府、馬政府到蔡政府第一年的各項數據，先讓大家自己畫出心中的感受，再來看看你跟真實數據的差異有多少吧！'
    },
    authorship: [{
      job: '數據分析',
      people: ['洪國鈞']
    }, {
      job: '編輯',
      people: ['蕭長展', '洪國鈞']
    }, {
      job: '設計開發',
      people: ['游知澔']
    }],
    conclusion: {
      title: '結論：關心政治、持續監督',
      description: '這次你得了幾分呢？蔡總統第一年的表現和你想的一樣嗎？\n\n真實的數據，是否讓你感到意外？逐年攀升的國債是否令你吃驚呢？事實上，現在立法院正在審查前瞻基礎建設特別條例，未來8年很可能會再舉債8千8百多億，國債也會繼續攀升，或許明年再看到這些圖表的時候，你會更為驚訝。\n\n在沃草，我們持續以各種方式報導國會，**努力降低理解複雜議題的門檻**。像《蔡總統的第一年》這樣的資訊新聞需要許多人力整理資料、設計、製作，如果你喜歡沃草的內容，請別忘了[支持我們](https://watchout.tw/#support)！'
    }
  },
  methods: {
    markdown: marked
  }
});