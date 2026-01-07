
// ==========================================
// 圖片資源管理服務 (Asset Service)
// ==========================================
// 使用指南 (How to use):
// 1. 將圖片上傳至 Google Drive，開啟「知道連結的使用者皆可檢視」。
// 2. 從連結中複製檔案 ID (例如: https://drive.google.com/file/d/THIS_IS_THE_ID/view)
// 3. 在下方 ASSETS 物件中，使用 getDriveImg('ID') 來註冊圖片。
// 4. 在程式碼中匯入: import { ASSETS } from '../services/assetService';
// ==========================================

// 工具函式：產生 Google Drive 直連圖片網址 (用於 <img src>)
// 原理：將檢視連結轉換為 export=view 格式
export const getDriveImg = (id: string) => `https://drive.google.com/uc?export=view&id=${id}`;

// 工具函式：產生 Google Drive 檢視頁面網址 (用於 <a href> 另開視窗)
// 適用於：PDF、資料夾、或是想讓使用者去 Drive 預覽的檔案
export const getDriveView = (id: string) => `https://drive.google.com/file/d/${id}/view?usp=sharing`;

export const ASSETS = {
  // 角色頭像 (Characters)
  CHARACTERS: {
    TEACHER: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher&glasses=probability=100&clothing=blazerAndShirt&hair=shortFlat&hairColor=black&skinColor=light',
    
    // [村長圖片設定]
    // 使用您提供的 Google Drive ID: 1xd9k87oKMMj0J3rnLx18770kQntVUWDi
    CHIEF: getDriveImg('1xd9k87oKMMj0J3rnLx18770kQntVUWDi'), 
    
    PLAYER: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Player&clothing=hoodie',
  },
  
  // 背景圖與介面圖 (UI & Backgrounds)
  BACKGROUNDS: {
    INTRO: getDriveImg('1-UVds4tg7gQxZo19uTgqyvfTwmEwI3c8'), // 永春陂老照片
  },

  // 任務相關資源 (Mission Assets)
  // 建議命名規則: M[任務編號]_[用途]
  PUZZLES: {
    M1: {
      MAIN_REF: getDriveImg('1-UVds4tg7gQxZo19uTgqyvfTwmEwI3c8'), // 任務一主要參考圖
      CHECK_1: getDriveImg('11CSe57nK3J-0hju0mRR8eDQ9g4hqn5JF'), // 驗證用範例圖 1
      CHECK_2: getDriveImg('1_XGaO_K9uv4SaZsAc-LIiSPDCXBVbLtt'), // 驗證用範例圖 2
    },
    M2: {
      MAIN_REF: getDriveImg('1XEaYf4LuoadsCnneUUGQPFBObLRE9ikA'),
      CHECK_1: getDriveImg('1pyoxwe__OHmvF5RwO3KUwunbBF7OSX4E'),
      CHECK_2: getDriveImg('1hkYG5AeVQqsTkLFS9X7r84TA3k_f6BMC'),
    },
    M3: {
      MAIN_REF: getDriveImg('1h1z0gNtdVvAfhZr_DqhbYAZJk3dxj0zL'),
      HINT_VIEW: getDriveView('1XjI4JsPsBlYo5uo_e4TePtDssbcQOYr6'), // 任務三提示圖 (另開視窗)
    },
    SIDE_1: {
      CHECK_1: getDriveImg('1luPB-i-a_YzHmPQiJVcxthPDBiPpv6Zl'),
      CHECK_2: getDriveImg('1p0Az9jvsbjadMIQojasL4rhlr63mrf5D'),
    }
  },

  // 外部連結 (External Links)
  // 地圖連結、資料夾連結、表單連結
  LINKS: {
    MAPY_M1: 'https://mapy.com/en/zakladni?l=0&x=121.5825656&y=25.0303884&z=16',
    GEO_MAP: 'https://geomap.gsmma.gov.tw/gwh/gsb97-1/sys8a/t3/index1.cfm',
    MAPY_CZ: 'https://en.mapy.cz/turisticka?x=121.5810&y=25.0310&z=16',
    M2_HINT_FOLDER: 'https://drive.google.com/drive/folders/1dGZAsbD-9MiJw3zUmwKkAt7juWJeXzt0?usp=drive_link',
    SIDE_HINT_FOLDER: 'https://drive.google.com/drive/folders/1kRvBQLBJbDLCND8kM9H2viI2l6ZcHxon?usp=sharing',
    SURVEY_FORM: 'https://docs.google.com/forms/d/e/1FAIpQLSdAGXib_RfYl3wLCIHezeNzJBtYzvnz_RU9NA9eXr_qjIWJNQ/viewform',
  }
};
