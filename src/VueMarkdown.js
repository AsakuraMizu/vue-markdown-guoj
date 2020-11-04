import markdownIt from "markdown-it";
import emoji from "markdown-it-emoji";
import subscript from "markdown-it-sub";
import superscript from "markdown-it-sup";
import footnote from "markdown-it-footnote";
import deflist from "markdown-it-deflist";
import abbreviation from "markdown-it-abbr";
import insert from "markdown-it-ins";
import mark from "markdown-it-mark";
import toc from "markdown-it-toc-and-anchor";
import tasklists from "markdown-it-task-lists";
import echarts from "./markdown-it-plugin-echarts";
import mermaid from "./markdown-it-plugin-mermaid";
import flowchart from "./markdown-it-plugin-flowchart";
import graphviz from "markdown-it-graphviz";

const MathJax = require("mathjax-full/js/mathjax.js").mathjax;
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import { LiteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
const AllPackages = require("mathjax-full/js/input/tex/AllPackages.js")
  .AllPackages;
let liteAdaptor = new LiteAdaptor({ fontSize: 14 });
RegisterHTMLHandler(liteAdaptor);
function renderMathjax(src, options) {
  let doc = liteAdaptor.parse(src);
  const html = MathJax.document(doc, {
    InputJax: new TeX({
      inlineMath: [["\\(", "\\)"]],
      displayMath: [["\\[", "\\]"]],
      processEscapes: true,
      maxBuffer: 5 * 1024,
      packages: AllPackages,
    }),
    OutputJax: new SVG(),
  });
  html.render();
  return liteAdaptor.innerHTML(liteAdaptor.body(html.document));
}

export default {
  md: new markdownIt(),

  template: "<div><slot></slot></div>",

  data() {
    return {
      sourceData: this.source,
    };
  },

  props: {
    watches: {
      type: Array,
      default: () => ["source", "show", "toc"],
    },
    source: {
      type: String,
      default: ``,
    },
    show: {
      type: Boolean,
      default: true,
    },
    highlight: {
      type: Boolean,
      default: true,
    },
    html: {
      type: Boolean,
      default: true,
    },
    xhtmlOut: {
      type: Boolean,
      default: true,
    },
    breaks: {
      type: Boolean,
      default: true,
    },
    linkify: {
      type: Boolean,
      default: true,
    },
    emoji: {
      type: Boolean,
      default: true,
    },
    typographer: {
      type: Boolean,
      default: true,
    },
    langPrefix: {
      type: String,
      default: "language-",
    },
    quotes: {
      type: String,
      default: "“”‘’",
    },
    tableClass: {
      type: String,
      default: "table",
    },
    taskLists: {
      type: Boolean,
      default: true,
    },
    toc: {
      type: Boolean,
      default: false,
    },
    tocId: {
      type: String,
    },
    tocClass: {
      type: String,
      default: "table-of-contents",
    },
    tocFirstLevel: {
      type: Number,
      default: 2,
    },
    tocLastLevel: {
      type: Number,
    },
    tocAnchorLink: {
      type: Boolean,
      default: true,
    },
    tocAnchorClass: {
      type: String,
      default: "toc-anchor",
    },
    tocAnchorLinkSymbol: {
      type: String,
      default: "#",
    },
    tocAnchorLinkSpace: {
      type: Boolean,
      default: true,
    },
    tocAnchorLinkClass: {
      type: String,
      default: "toc-anchor-link",
    },
    anchorAttributes: {
      type: Object,
      default: () => ({}),
    },
    prerender: {
      type: Function,
      default: (sourceData) => {
        return sourceData;
      },
    },
    postrender: {
      type: Function,
      default: (htmlData) => {
        return htmlData;
      },
    },
    addtionMarkdownModules: {
      type: Array,
      default: () => ([]),
    },
  },

  computed: {
    tocLastLevelComputed() {
      return this.tocLastLevel > this.tocFirstLevel
        ? this.tocLastLevel
        : this.tocFirstLevel + 1;
    },
  },

  render(createElement) {
    this.md = new markdownIt()
      .use(subscript)
      .use(superscript)
      .use(footnote)
      .use(deflist)
      .use(abbreviation)
      .use(insert)
      .use(mark)
      .use(tasklists, { enabled: this.taskLists })
      .use(echarts)
      .use(graphviz)
      .use(mermaid)
      .use(flowchart)
      .use(require('markdown-it-container'))
      .use(require("markdown-it-mathjax")());

    for (i in this.addtionMarkdownModules) {
      this.md = this.md.use(i.module, i.options);
    }

    if (this.emoji) {
      this.md.use(emoji);
    }

    this.md.set({
      html: this.html,
      xhtmlOut: this.xhtmlOut,
      breaks: this.breaks,
      linkify: this.linkify,
      typographer: this.typographer,
      langPrefix: this.langPrefix,
      quotes: this.quotes,
    });
    this.md.renderer.rules.table_open = () =>
      `<table class="${this.tableClass}">\n`;
    let defaultLinkRenderer =
      this.md.renderer.rules.link_open ||
      function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
      };
    this.md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
      Object.keys(this.anchorAttributes).map((attribute) => {
        let aIndex = tokens[idx].attrIndex(attribute);
        let value = this.anchorAttributes[attribute];
        if (aIndex < 0) {
          tokens[idx].attrPush([attribute, value]); // add new attribute
        } else {
          tokens[idx].attrs[aIndex][1] = value;
        }
      });
      return defaultLinkRenderer(tokens, idx, options, env, self);
    };

    if (this.toc) {
      this.md.use(toc, {
        tocClassName: this.tocClass,
        tocFirstLevel: this.tocFirstLevel,
        tocLastLevel: this.tocLastLevelComputed,
        anchorLink: this.tocAnchorLink,
        anchorLinkSymbol: this.tocAnchorLinkSymbol,
        anchorLinkSpace: this.tocAnchorLinkSpace,
        anchorClassName: this.tocAnchorClass,
        anchorLinkSymbolClassName: this.tocAnchorLinkClass,
        tocCallback: (tocMarkdown, tocArray, tocHtml) => {
          if (tocHtml) {
            if (this.tocId && document.getElementById(this.tocId)) {
              document.getElementById(this.tocId).innerHTML = tocHtml;
            }

            this.$emit("toc-rendered", tocHtml);
          }
        },
      });
    }

    let outHtml = this.show
      ? this.md.render(this.prerender(this.sourceData))
      : "";
    outHtml = renderMathjax(outHtml);
    outHtml = this.postrender(outHtml);

    this.$emit("rendered", outHtml);
    return createElement("div", {
      domProps: {
        innerHTML: outHtml,
      },
    });
  },

  beforeMount() {
    if (this.$slots.default) {
      this.sourceData = "";
      for (let slot of this.$slots.default) {
        this.sourceData += slot.text;
      }
    }

    this.$watch("source", () => {
      this.sourceData = this.prerender(this.source);
      this.$forceUpdate();
      // render echarts
      document.querySelectorAll(".md-echarts").forEach((element) => {
        try {
          let options = JSON.parse(element.textContent);
          let chart = echarts.init(element);
          chart.setOption(options);
        } catch (e) {
          element.outerHTML = `<pre>echarts complains: ${e}</pre>`;
        }
      });
      // render mermaid
      mermaid.init(undefined, document.querySelectorAll(".mermaid"));
      // render flowchart
      document.querySelectorAll(".md-flowchart").forEach((element) => {
        try {
          let code = element.textContent;
          let chart = flowchart.parse(code);
          element.textContent = "";
          chart.drawSVG(element);
        } catch (e) {
          element.outerHTML = `<pre>flowchart complains: ${e}</pre>`;
        }
      });
    });

    this.watches.forEach((v) => {
      this.$watch(v, () => {
        this.$forceUpdate();
      });
    });
  },
};
