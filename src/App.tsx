import {
  ChangeEvent,
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import './App.css';
import { useTranslation } from 'react-i18next';

enum LEVEL {
  ELEMENTARY = 'elementary',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  CUSTOM = 'custom',
}

enum MARK {
  NONE,
  FLAG,
  QUESTION,
  FORBIDDEN,
}

const IMAGE: Record<number | string, HTMLImageElement> = {
  1: (() => {
    const img = document.createElement('img');
    img.src = '/src/assets/1.png';
    return img;
  })(),
  2: (() => {
    const img = document.createElement('img');
    img.src = '/src/assets/2.png';
    return img;
  })(),
  3: (() => {
    const img = document.createElement('img');
    img.src = '/src/assets/3.png';
    return img;
  })(),
  4: (() => {
    const img = document.createElement('img');
    img.src = '/src/assets/4.png';
    return img;
  })(),
  5: (() => {
    const img = document.createElement('img');
    img.src = '/src/assets/5.png';
    return img;
  })(),
  6: (() => {
    const img = document.createElement('img');
    img.src = '/src/assets/6.png';
    return img;
  })(),
  7: (() => {
    const img = document.createElement('img');
    img.src = '/src/assets/7.png';
    return img;
  })(),
  8: (() => {
    const img = document.createElement('img');
    img.src = '/src/assets/8.png';
    return img;
  })(),
  MINE: (() => {
    const img = document.createElement('img');
    img.src = '/src/assets/mine.png';
    return img;
  })(),
  MARK: (() => {
    const img = document.createElement('img');
    img.src = '/src/assets/mark.png';
    return img;
  })(),
  Q: (() => {
    const img = document.createElement('img');
    img.src = '/src/assets/q.png';
    return img;
  })(),
};

function App() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [cnt, setCnt] = useState(10);
  const [sec, setSec] = useState(0);
  const startTimeRef = useRef(0);
  const [img, setImg] = useState('normal');
  const [height, setHeight] = useState(9);
  const [width, setWidth] = useState(9);
  const [mine, setMine] = useState(10);
  const [level, setLevel] = useState<LEVEL>(LEVEL.ELEMENTARY);
  const [qMark, setQMark] = useState(true);
  const musicRef = useRef<HTMLAudioElement>(null);
  const [sound, setSound] = useState(true);
  const soundRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blockRef = useRef<number[][]>([]);
  const markRef = useRef<MARK[][]>([]);
  const intervalRef = useRef<number>();

  document.title = t('title');

  const getTime = () => {
    const second = sec % 60;
    return `${Math.floor(sec / 60)}:${second < 10 ? '0' + second : second}`;
  };

  const handleLevelChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value as LEVEL;
    setLevel(val);
    switch (val) {
      case LEVEL.ELEMENTARY:
        setHeight(9);
        setWidth(9);
        setMine(10);
        break;
      case LEVEL.INTERMEDIATE:
        setHeight(16);
        setWidth(16);
        setMine(40);
        break;
      case LEVEL.ADVANCED:
        setHeight(16);
        setWidth(30);
        setMine(99);
        break;
    }
  }, []);

  const handleBlur = () => {
    let h = height,
      w = width;
    if (height < 9) {
      setHeight(9);
      h = 9;
    } else if (height > 24) {
      setHeight(24);
      h = 24;
    }
    if (width < 9) {
      setWidth(9);
      w = 9;
    } else if (width > 30) {
      setWidth(30);
      w = 30;
    }
    const val = Math.floor(h * w * 0.9);
    if (mine < 10) {
      setMine(10);
    } else if (mine > val) {
      setMine(val);
    }
  };

  useEffect(() => {
    const handleMouseDown = () => {
      if (img === 'normal') {
        setImg('click');
      }

      // 受浏览器限制，用户进行首次交互后才允许播放音乐，故在首次点击后播放音乐
      const ele = musicRef.current!;
      if (ele.muted) {
        ele.muted = false;
        ele.play();
      }
    };

    const handleMouseUp = () => {
      if (img === 'click') {
        setImg('normal');
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [img]);

  const newGame = useCallback(() => {
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.fillStyle = 'darkgray';
    const w = width * 26 + 2,
      h = height * 26 + 2;
    ctx.clearRect(0, 0, w, h);
    for (let x = width * 26; x >= 0; x -= 26) {
      ctx.fillRect(x, 0, 2, h);
    }
    for (let y = height * 26; y >= 0; y -= 26) {
      ctx.fillRect(0, y, w, 2);
    }
    blockRef.current = new Array(height)
      .fill(0)
      .map(() => new Array(width).fill(0));
    markRef.current = new Array(height)
      .fill(MARK.NONE)
      .map(() => new Array(width).fill(MARK.NONE));
    setImg('normal');
    setSec(0);
    setCnt(mine);
    clearInterval(intervalRef.current);
    intervalRef.current = void 0;
  }, [height, width, mine]);

  useEffect(() => {
    newGame();
  }, [newGame]);

  const startGame = useCallback(
    (row: number, col: number) => {
      if (intervalRef.current) {
        return;
      }

      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 250);

      const rec = new Array(width * height).fill(0).map((_, i) => i);
      rec.splice(row * width + col, 1);
      const blocks = blockRef.current;
      for (let n = 0; n < mine; n++) {
        const idx = Math.floor(Math.random() * rec.length);
        const num = rec.splice(idx, 1)[0];
        blocks[Math.floor(num / width)][num % width] = -1;
      }

      for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
          if (blocks[i][j] === -1) {
            continue;
          }
          let num = 0;
          if (i !== 0) {
            if (j !== 0 && blocks[i - 1][j - 1] === -1) num++;
            if (blocks[i - 1][j] === -1) num++;
            if (j !== width - 1 && blocks[i - 1][j + 1] === -1) num++;
          }
          if (i !== height - 1) {
            if (j !== 0 && blocks[i + 1][j - 1] === -1) num++;
            if (blocks[i + 1][j] === -1) num++;
            if (j !== width - 1 && blocks[i + 1][j + 1] === -1) num++;
          }
          if (j !== 0 && blocks[i][j - 1] === -1) num++;
          if (j !== width - 1 && blocks[i][j + 1] === -1) num++;
          blocks[i][j] = num;
        }
      }
    },
    [width, height, mine],
  );

  const handleCanvasClick: MouseEventHandler<HTMLCanvasElement> = useCallback(
    (e) => {
      if (['fail', 'success'].includes(img)) {
        return;
      }

      const cvs = canvasRef.current!;
      const rect = cvs.getBoundingClientRect();
      const x = e.clientX - rect.left,
        y = e.clientY - rect.top;

      if (x % 26 < 2 || y % 26 < 2) {
        return;
      }

      const row = Math.floor((y - 2) / 26),
        col = Math.floor((x - 2) / 26);
      const mark = markRef.current;
      if ([MARK.FLAG, MARK.FORBIDDEN].includes(mark[row][col])) {
        return;
      }
      startGame(row, col);
      const ctx = cvs.getContext('2d')!;
      const blocks = blockRef.current!;
      if (blocks[row][col] === -1) {
        clearInterval(intervalRef.current);
        setImg('fail');
        if (sound) {
          const au = soundRef.current!;
          au.src = '/src/assets/fail.mp3';
          au.play();
        }
        for (let i = 0; i < height; i++) {
          for (let j = 0; j < width; j++) {
            if (blocks[i][j] === -1) {
              if (mark[i][j] === MARK.FLAG) {
                continue;
              }
              ctx.clearRect(2 + j * 26, 2 + i * 26, 24, 24);
              if (i === row && j === col) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
              } else {
                ctx.fillStyle = 'rgba(64, 64, 64, 0.3)';
              }
              ctx.fillRect(2 + j * 26, 2 + i * 26, 24, 24);
              ctx.drawImage(IMAGE.MINE, 2 + j * 26, 2 + i * 26, 24, 24);
            } else {
              if (mark[i][j] !== MARK.FLAG) {
                continue;
              }
              ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(4 + j * 26, 4 + i * 26);
              ctx.lineTo(24 + j * 26, 24 + i * 26);
              ctx.moveTo(24 + j * 26, 4 + i * 26);
              ctx.lineTo(4 + j * 26, 24 + i * 26);
              ctx.stroke();
            }
          }
        }
        return;
      }

      const normalClick = (row: number, col: number) => {
        if (
          row < 0 ||
          row >= height ||
          col < 0 ||
          col >= width ||
          mark[row][col] === MARK.FORBIDDEN
        ) {
          return;
        }

        mark[row][col] = MARK.FORBIDDEN;
        ctx.clearRect(2 + col * 26, 2 + row * 26, 24, 24);
        ctx.fillStyle = 'rgba(64, 64, 64, 0.3)';
        ctx.fillRect(2 + col * 26, 2 + row * 26, 24, 24);
        const num = blocks[row][col];
        if (num === 0) {
          normalClick(row - 1, col);
          normalClick(row, col - 1);
          normalClick(row, col + 1);
          normalClick(row + 1, col);
        } else {
          ctx.drawImage(IMAGE[num], 2 + col * 26, 2 + row * 26, 24, 24);
        }
      };
      normalClick(row, col);

      if (
        width * height -
          mark.reduce(
            (prev, curr) =>
              prev +
              curr.reduce(
                (prev, curr) => prev + (curr === MARK.FORBIDDEN ? 1 : 0),
                0,
              ),
            0,
          ) ===
        mine
      ) {
        clearInterval(intervalRef.current);
        setImg('success');
        if (sound) {
          const au = soundRef.current!;
          au.src = '/src/assets/success.mp3';
          au.play();
        }
        for (let i = 0; i < height; i++) {
          for (let j = 0; j < width; j++) {
            if (blocks[i][j] !== -1) {
              continue;
            }
            ctx.clearRect(2 + j * 26, 2 + i * 26, 24, 24);
            ctx.drawImage(IMAGE.MARK, 2 + j * 26, 2 + i * 26, 24, 24);
          }
        }
      }
    },
    [img, startGame, width, height, mine, sound],
  );

  const handleCanvasRightClick: MouseEventHandler<HTMLCanvasElement> =
    useCallback(
      (e) => {
        e.preventDefault();
        if (['fail', 'success'].includes(img)) {
          return;
        }

        const cvs = canvasRef.current!;
        const rect = cvs.getBoundingClientRect();
        const x = e.clientX - rect.left,
          y = e.clientY - rect.top;

        if (x % 26 < 2 || y % 26 < 2) {
          return;
        }

        const row = Math.floor((y - 2) / 26),
          col = Math.floor((x - 2) / 26);
        const mark = markRef.current;
        const ctx = cvs.getContext('2d')!;
        switch (mark[row][col]) {
          case MARK.NONE:
            mark[row][col] = MARK.FLAG;
            ctx.clearRect(col * 26 + 2, row * 26 + 2, 24, 24);
            ctx.drawImage(IMAGE.MARK, col * 26 + 2, row * 26 + 2, 24, 24);
            setCnt(cnt - 1);
            break;
          case MARK.FLAG:
            ctx.clearRect(col * 26 + 2, row * 26 + 2, 24, 24);
            if (qMark) {
              mark[row][col] = MARK.QUESTION;
              ctx.drawImage(IMAGE.Q, col * 26 + 2, row * 26 + 2, 24, 24);
            } else {
              mark[row][col] = MARK.NONE;
            }
            setCnt(cnt + 1);
            break;
          case MARK.QUESTION:
            ctx.clearRect(col * 26 + 2, row * 26 + 2, 24, 24);
            break;
        }
      },
      [cnt, img, qMark],
    );

  return (
    <>
      <button className='menu-btn' onClick={() => setOpen(true)}>
        {t('menu')}
      </button>

      <div className='top-bar'>
        <span className='info-txt'>{cnt}</span>
        <button
          onClick={newGame}
          className='pic-btn'
          style={{ backgroundImage: `url('/src/assets/${img}.png')` }}
        />
        <span className='info-txt'>{getTime()}</span>
      </div>

      <div className='container'>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onContextMenu={handleCanvasRightClick}
          width={26 * width + 2}
          height={26 * height + 2}
        />
        <audio ref={soundRef} />
      </div>

      <div
        className='mask'
        style={{ display: open ? void 0 : 'none' }}
        onClick={() => setOpen(false)}
      />
      <div className={'drawer ' + (open ? 'drawer-open' : '')}>
        <button className='drawer-btn' onClick={newGame}>
          {t('newGame')}
        </button>
        <p>{t('level')}</p>
        <div>
          <input
            type='radio'
            value={LEVEL.ELEMENTARY}
            id={LEVEL.ELEMENTARY}
            name='level'
            checked={level === LEVEL.ELEMENTARY}
            onChange={handleLevelChange}
          />
          <label htmlFor={LEVEL.ELEMENTARY}>{t('elementary')}</label>
        </div>
        <div>
          <input
            type='radio'
            value={LEVEL.INTERMEDIATE}
            id={LEVEL.INTERMEDIATE}
            name='level'
            checked={level === LEVEL.INTERMEDIATE}
            onChange={handleLevelChange}
          />
          <label htmlFor={LEVEL.INTERMEDIATE}>{t('intermediate')}</label>
        </div>
        <div>
          <input
            type='radio'
            value={LEVEL.ADVANCED}
            id={LEVEL.ADVANCED}
            name='level'
            checked={level === LEVEL.ADVANCED}
            onChange={handleLevelChange}
          />
          <label htmlFor={LEVEL.ADVANCED}>{t('advanced')}</label>
        </div>
        <div>
          <input
            type='radio'
            value={LEVEL.CUSTOM}
            id={LEVEL.CUSTOM}
            name='level'
            checked={level === LEVEL.CUSTOM}
            onChange={handleLevelChange}
          />
          <label htmlFor={LEVEL.CUSTOM}>{t('custom')}</label>
        </div>
        <div>
          <label htmlFor='height'>{t('height')}</label>
          <input
            id='height'
            value={height}
            onChange={(e) => setHeight(Math.floor(Number(e.target.value)))}
            onBlur={handleBlur}
            type='number'
            min={9}
            max={24}
            disabled={level !== LEVEL.CUSTOM}
          />
        </div>
        <div>
          <label htmlFor='width'>{t('width')}</label>
          <input
            id='width'
            value={width}
            onChange={(e) => setWidth(Math.floor(Number(e.target.value)))}
            onBlur={handleBlur}
            type='number'
            min={9}
            max={30}
            disabled={level !== LEVEL.CUSTOM}
          />
        </div>
        <div>
          <label htmlFor='mine'>{t('mineCount')}</label>
          <input
            id='mine'
            value={mine}
            onChange={(e) => setMine(Math.floor(Number(e.target.value)))}
            onBlur={handleBlur}
            type='number'
            min={10}
            max={width * height * 0.9}
            disabled={level !== LEVEL.CUSTOM}
          />
        </div>

        <p>{t('settings')}</p>
        <div>
          <input
            type='checkbox'
            id='qMark'
            checked={qMark}
            onChange={(e) => setQMark(e.target.checked)}
          />
          <label htmlFor='qMark'>{t('qMark')}</label>
        </div>
        <div>
          <input
            type='checkbox'
            id='music'
            defaultChecked
            onChange={(e) => {
              const ele = musicRef.current!;
              if (e.target.checked) {
                ele.play();
              } else {
                ele.pause();
              }
            }}
          />
          <label htmlFor='music'>{t('music')}</label>
          <audio autoPlay muted loop src='/src/assets/bgm.mp3' ref={musicRef} />
        </div>
        <div>
          <input
            type='checkbox'
            id='sound'
            checked={sound}
            onChange={(e) => setSound(e.target.checked)}
          />
          <label htmlFor='sound'>{t('sound')}</label>
        </div>
        <div>
          <label htmlFor='lng'>{t('language')}</label>
          <select
            id='lng'
            defaultValue={i18n.language}
            onChange={(e) => {
              const val = e.target.value;
              i18n.changeLanguage(val);
              document.querySelector('html')!.lang = val;
            }}
          >
            <option value='en' lang='en'>
              English
            </option>
            <option value='zh-Hans' lang='zh-Hans'>
              简体中文
            </option>
            <option value='zh-Hant' lang='zh-Hant'>
              繁體中文
            </option>
            <option value='ja' lang='ja'>
              日本語
            </option>
          </select>
        </div>

        <div className='drawer-last'>
          <button className='drawer-btn' onClick={() => setOpen(false)}>
            {t('close')}
          </button>
        </div>
      </div>
    </>
  );
}

export default App;
