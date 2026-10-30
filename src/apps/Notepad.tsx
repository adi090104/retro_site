import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { MenuBar } from '../components/Menu';
import type { MenuBarMenu } from '../components/Menu';
import { useFs } from '../fs/fsStore';
import { canWrite, displayPath } from '../fs/fsUtils';
import { showDialog } from '../state/actions';
import { setCloseGuard, useWM } from '../state/windowStore';
import { cx } from '../utils/cx';

export function Notepad({ winId, fileId }: { winId: string; fileId?: string }) {
  const [fid, setFid] = useState(fileId);
  const file = useFs((s) => (fid ? s.nodes[fid] : undefined));
  const [text, setText] = useState(() => (fileId ? (useFs.getState().nodes[fileId]?.content ?? '') : ''));
  const [savedText, setSavedText] = useState(text);
  const [wrap, setWrap] = useState(true);
  const ref = useRef<HTMLTextAreaElement>(null);
  const setTitle = useWM((s) => s.setTitle);
  const close = useWM((s) => s.close);

  const name = file?.name ?? 'Untitled';
  const dirty = text !== savedText;

  useEffect(() => setTitle(winId, `${name} - Notepad`, 'notepad'), [winId, name, setTitle]);
  useEffect(() => ref.current?.focus(), []);

  /** Returns true if the text was saved. */
  const save = (): boolean => {
    const fs = useFs.getState();
    if (file) {
      if (!file.parentId || !canWrite(fs.nodes, file.parentId)) {
        showDialog(`Cannot save ${displayPath(fs.nodes, file.id)}.\n\nThe disk is write-protected.`, 'error', 'Notepad');
        return false;
      }
      fs.writeFile(file.id, text);
    } else {
      setFid(fs.createNode('documents', 'file', 'Untitled.txt', text));
    }
    setSavedText(text);
    return true;
  };

  const confirmDiscard = (then: () => void) => {
    if (!dirty) return then();
    showDialog(`The text in the ${name} file has changed.\n\nDo you want to save the changes?`, 'warning', 'Notepad', [
      { label: '&Yes', action: () => save() && then() },
      { label: '&No', action: then },
      { label: 'Cancel' },
    ]);
  };

  // The guard reads the latest render's state, so re-register it every render.
  useEffect(() => {
    setCloseGuard(winId, () => {
      if (!dirty) return true;
      confirmDiscard(() => close(winId));
      return false;
    });
  });
  useEffect(() => () => setCloseGuard(winId, null), [winId]);

  const newDocument = () =>
    confirmDiscard(() => {
      setFid(undefined);
      setText('');
      setSavedText('');
    });

  const insertTimeDate = () => {
    const el = ref.current;
    if (!el) return;
    const now = new Date();
    const stamp = `${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} ${now.toLocaleDateString()}`;
    const { selectionStart: start, selectionEnd: end } = el;
    setText(text.slice(0, start) + stamp + text.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + stamp.length;
    });
  };

  const exec = (command: 'undo' | 'cut' | 'copy' | 'delete' | 'selectAll') => {
    ref.current?.focus();
    document.execCommand(command);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      save();
    } else if (e.key === 'F5') {
      e.preventDefault();
      insertTimeDate();
    }
  };

  const menus: MenuBarMenu[] = [
    {
      label: '&File',
      items: [
        { label: '&New', onClick: newDocument },
        { label: '&Open...', disabled: true },
        { label: '&Save', shortcut: 'Ctrl+S', onClick: save },
        { label: 'Save &As...', disabled: true },
        'separator',
        { label: 'Page Se&tup...', disabled: true },
        { label: '&Print', disabled: true },
        'separator',
        { label: 'E&xit', onClick: () => useWM.getState().requestClose(winId) },
      ],
    },
    {
      label: '&Edit',
      items: [
        { label: '&Undo', shortcut: 'Ctrl+Z', onClick: () => exec('undo') },
        'separator',
        { label: 'Cu&t', shortcut: 'Ctrl+X', onClick: () => exec('cut') },
        { label: '&Copy', shortcut: 'Ctrl+C', onClick: () => exec('copy') },
        { label: '&Paste', shortcut: 'Ctrl+V', disabled: true },
        { label: 'De&lete', shortcut: 'Del', onClick: () => exec('delete') },
        'separator',
        { label: 'Select &All', onClick: () => exec('selectAll') },
        { label: 'Time/&Date', shortcut: 'F5', onClick: insertTimeDate },
        'separator',
        { label: '&Word Wrap', checked: wrap, onClick: () => setWrap(!wrap) },
      ],
    },
    { label: '&Search', items: [{ label: '&Find...', disabled: true }, { label: 'Find &Next', shortcut: 'F3', disabled: true }] },
    {
      label: '&Help',
      items: [
        {
          label: '&About Notepad',
          onClick: () => showDialog('Notepad\n\nThe finest text editor of 1998.\nNo fonts. No formatting. No regrets.', 'info', 'About Notepad'),
        },
      ],
    },
  ];

  return (
    <div className="notepad">
      <MenuBar menus={menus} />
      <textarea
        ref={ref}
        className={cx('notepad-text', !wrap && 'nowrap')}
        value={text}
        wrap={wrap ? 'soft' : 'off'}
        spellCheck={false}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
