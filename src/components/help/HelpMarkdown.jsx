/**
 * Lightweight markdown → React for help chat bubbles.
 * Supports: headings, bold, italics, code, unordered + numbered lists
 * (with nested bullets under a numbered item so 1/2/3 stay continuous).
 */
function inlineFormat(text) {
  const nodes = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let m;
  let key = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(text.slice(last, m.index));
    }
    const token = m[0];
    if (token.startsWith("**")) {
      nodes.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(
        <code key={key++} className="eco-help-md-code">
          {token.slice(1, -1)}
        </code>
      );
    } else {
      nodes.push(<em key={key++}>{token.slice(1, -1)}</em>);
    }
    last = m.index + token.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function renderListItem(item, i) {
  return (
    <li key={i}>
      <div className="eco-help-md-li-main">{inlineFormat(item.text)}</div>
      {item.children?.length ? (
        <ul className="eco-help-md-ul eco-help-md-ul--nested">
          {item.children.map((child, j) => (
            <li key={j}>{inlineFormat(child)}</li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function HelpMarkdown({ text }) {
  const raw = String(text || "");
  if (!raw.trim()) return null;

  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  // { ordered: boolean, text: string, children?: string[] }
  let listBuf = [];
  let key = 0;

  const flushList = () => {
    if (!listBuf.length) return;
    const ordered = listBuf[0].ordered;
    const Tag = ordered ? "ol" : "ul";
    const className = ordered ? "eco-help-md-ol" : "eco-help-md-ul";
    blocks.push(
      <Tag key={key++} className={className}>
        {listBuf.map((item, i) => renderListItem(item, i))}
      </Tag>
    );
    listBuf = [];
  };

  const pushTopItem = (ordered, text) => {
    if (listBuf.length && listBuf[0].ordered !== ordered) {
      flushList();
    }
    listBuf.push({ ordered, text, children: [] });
  };

  for (const line of lines) {
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const bullet = line.match(/^\s*[-*•]\s+(.+)$/);
    // Ignore the written number — <ol> auto-numbers 1,2,3… (fixes LLM repeating "1.")
    const numbered = line.match(/^\s*\d+[.)]\s+(.+)$/);

    if (heading) {
      flushList();
      const level = heading[1].length;
      const Tag = level === 1 ? "h4" : level === 2 ? "h5" : "h6";
      blocks.push(
        <Tag key={key++} className={`eco-help-md-h eco-help-md-h${level}`}>
          {inlineFormat(heading[2])}
        </Tag>
      );
      continue;
    }

    if (numbered) {
      pushTopItem(true, numbered[1]);
      continue;
    }

    if (bullet) {
      // Nest under current ordered item instead of breaking the <ol> (keeps 1,2,3 continuous)
      if (listBuf.length && listBuf[0].ordered === true) {
        const last = listBuf[listBuf.length - 1];
        if (!last.children) last.children = [];
        last.children.push(bullet[1]);
        continue;
      }
      pushTopItem(false, bullet[1]);
      continue;
    }

    // Blank line inside an ordered list with open item: keep list open (don't flush)
    if (!line.trim() && listBuf.length && listBuf[0].ordered) {
      continue;
    }

    flushList();

    if (!line.trim()) {
      blocks.push(<div key={key++} className="eco-help-md-spacer" />);
      continue;
    }

    blocks.push(
      <p key={key++} className="eco-help-md-p">
        {inlineFormat(line)}
      </p>
    );
  }

  flushList();

  return <div className="eco-help-md">{blocks}</div>;
}
