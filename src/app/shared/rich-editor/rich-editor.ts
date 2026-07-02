import {
  Component, ElementRef, EventEmitter, Input, Output,
  AfterViewInit, OnChanges, OnDestroy, SimpleChanges, ViewChild, signal,
} from '@angular/core';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Highlight } from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';

/**
 * Yeniden kullanılabilir zengin metin editörü (TipTap / ProseMirror).
 * İçerik HTML olarak alınır/verilir. `content` girişi başlangıç/temizleme için,
 * `contentChange` her düzenlemede güncel HTML'i yayar.
 */
@Component({
  selector: 'app-rich-editor',
  standalone: true,
  templateUrl: './rich-editor.html',
  styleUrl: './rich-editor.scss',
})
export class RichEditor implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('host') hostRef!: ElementRef<HTMLElement>;
  @Input() content = '';
  @Input() placeholder = 'Yazmaya başla…';
  @Output() contentChange = new EventEmitter<string>();

  private editor?: Editor;
  /** Araç çubuğu aktif durumları (toggle vurgusu için). */
  readonly state = signal<Record<string, boolean>>({});

  /** Renk / vurgu paneli açık/kapalı durumu. */
  readonly textColorOpen = signal(false);
  readonly highlightOpen = signal(false);

  readonly textColors = ['#e03131', '#1971c2', '#2f9e44', '#f08c00', '#9c36b5', '#0c8599'];
  readonly highlightColors = ['#ffec99', '#b2f2bb', '#a5d8ff', '#ffc9c9', '#eebefa', '#ffd8a8'];

  ngAfterViewInit() {
    this.editor = new Editor({
      element: this.hostRef.nativeElement,
      extensions: [
        StarterKit.configure({ link: { openOnClick: false } }),
        Placeholder.configure({ placeholder: this.placeholder }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Highlight.configure({ multicolor: true }),
        TextStyle,
        Color,
        Image.configure({ inline: false }),
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
      ],
      content: this.content || '',
      onTransaction: () => this.syncState(),
      onUpdate: ({ editor }) => this.contentChange.emit(editor.getHTML()),
    });
    this.syncState();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['content'] && this.editor) {
      const value = this.content || '';
      if (value !== this.editor.getHTML()) {
        this.editor.commands.setContent(value, { emitUpdate: false });
      }
    }
  }

  ngOnDestroy() {
    this.editor?.destroy();
  }

  private chain() {
    return this.editor!.chain().focus();
  }

  // --- Komutlar ---
  toggleBold() { this.chain().toggleBold().run(); }
  toggleItalic() { this.chain().toggleItalic().run(); }
  toggleUnderline() { this.chain().toggleUnderline().run(); }
  toggleStrike() { this.chain().toggleStrike().run(); }
  toggleCode() { this.chain().toggleCode().run(); }
  setHeading(level: 1 | 2 | 3) { this.chain().toggleHeading({ level }).run(); }
  toggleBullet() { this.chain().toggleBulletList().run(); }
  toggleOrdered() { this.chain().toggleOrderedList().run(); }
  toggleBlockquote() { this.chain().toggleBlockquote().run(); }
  toggleCodeBlock() { this.chain().toggleCodeBlock().run(); }
  setHr() { this.chain().setHorizontalRule().run(); }
  undo() { this.chain().undo().run(); }
  redo() { this.chain().redo().run(); }

  setLink() {
    const prev = this.editor!.getAttributes('link')['href'] ?? '';
    const url = window.prompt('Bağlantı URL’si:', prev);
    if (url === null) return;
    if (url === '') {
      this.chain().unsetLink().run();
    } else {
      this.chain().setLink({ href: url }).run();
    }
  }

  // --- Yapılacak listesi (checkbox) ---
  toggleTaskList() { this.chain().toggleTaskList().run(); }

  // --- Görsel ---
  insertImage() {
    const url = window.prompt('Görsel URL’si:');
    if (!url) return;
    this.chain().setImage({ src: url }).run();
  }

  // --- Metin rengi ---
  toggleTextColorMenu() {
    this.highlightOpen.set(false);
    this.textColorOpen.update(v => !v);
  }
  applyColor(color: string) {
    this.chain().setColor(color).run();
    this.textColorOpen.set(false);
  }
  clearColor() {
    this.chain().unsetColor().run();
    this.textColorOpen.set(false);
  }

  // --- Vurgu ---
  toggleHighlightMenu() {
    this.textColorOpen.set(false);
    this.highlightOpen.update(v => !v);
  }
  applyHighlight(color: string) {
    this.chain().setHighlight({ color }).run();
    this.highlightOpen.set(false);
  }
  clearHighlight() {
    this.chain().unsetHighlight().run();
    this.highlightOpen.set(false);
  }

  // --- Tablo ---
  insertTable() {
    this.chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }
  addColumn() { this.chain().addColumnAfter().run(); }
  addRow() { this.chain().addRowAfter().run(); }
  deleteColumn() { this.chain().deleteColumn().run(); }
  deleteRow() { this.chain().deleteRow().run(); }
  deleteTable() { this.chain().deleteTable().run(); }

  private syncState() {
    const e = this.editor!;
    this.state.set({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      code: e.isActive('code'),
      h1: e.isActive('heading', { level: 1 }),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      blockquote: e.isActive('blockquote'),
      codeBlock: e.isActive('codeBlock'),
      link: e.isActive('link'),
      task: e.isActive('taskList'),
      highlight: e.isActive('highlight'),
      table: e.isActive('table'),
    });
  }
}
