import { exec } from 'child_process'

/**
 * Execute an AppleScript string via osascript.
 * Only available on macOS.
 */
export function runAppleScript(script: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (process.platform !== 'darwin') {
      reject(new Error('AppleScript is only available on macOS'))
      return
    }

    // Escape single quotes for shell safety
    const escaped = script.replace(/'/g, `'"'"'`)
    exec(`osascript -e '${escaped}'`, { timeout: 15000 }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || err.message))
        return
      }
      resolve(stdout.trim())
    })
  })
}

/**
 * Run an AppleScript file.
 */
export function runAppleScriptFile(filePath: string, args: string[] = []): Promise<string> {
  return new Promise((resolve, reject) => {
    if (process.platform !== 'darwin') {
      reject(new Error('AppleScript is only available on macOS'))
      return
    }

    const quotedArgs = args.map((a) => `"${a.replace(/"/g, '\\"')}"`).join(' ')
    exec(`osascript "${filePath}" ${quotedArgs}`, { timeout: 15000 }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || err.message))
        return
      }
      resolve(stdout.trim())
    })
  })
}

// ─── Apple Mail ──────────────────────────────────────────────────────────────

export async function fetchMailMessages(count = 10): Promise<string> {
  const script = `
    tell application "Mail"
      set allMessages to {}
      set inbox to mailbox "INBOX" of first account
      set msgs to (messages of inbox whose read status is false)
      set msgs to items 1 thru (count of msgs) of msgs
      if (count of msgs) > ${count} then set msgs to items 1 thru ${count} of msgs
      repeat with m in msgs
        set msgId to message id of m
        set msgSubject to subject of m
        set msgSender to sender of m
        set msgDate to date received of m as string
        set msgRead to read status of m as string
        set msgPreview to extract address from msgSender
        -- Get first 200 chars of content
        try
          set msgBody to (content of m)
          if (length of msgBody) > 200 then
            set msgBody to (characters 1 thru 200 of msgBody) as string
          end if
        on error
          set msgBody to ""
        end try
        set allMessages to allMessages & {msgId & "|||" & msgSubject & "|||" & msgSender & "|||" & msgDate & "|||" & msgBody}
      end repeat
      set AppleScript's text item delimiters to "~~~"
      set result to allMessages as string
      set AppleScript's text item delimiters to ""
      return result
    end tell
  `
  return runAppleScript(script)
}

// ─── Apple Reminders ─────────────────────────────────────────────────────────

export async function fetchReminders(listName?: string): Promise<string> {
  const listFilter = listName ? `list "${listName}" of` : 'every list of'
  const script = `
    tell application "Reminders"
      set allReminders to {}
      set targetLists to ${listFilter} application "Reminders"
      repeat with rl in targetLists
        set listTitle to name of rl
        set incompleteReminders to (reminders in rl whose completed is false)
        repeat with r in incompleteReminders
          set rId to id of r
          set rName to name of r
          set rCompleted to completed of r as string
          try
            set rDue to due date of r as string
          on error
            set rDue to "none"
          end try
          try
            set rBody to body of r
            if rBody is missing value then set rBody to ""
          on error
            set rBody to ""
          end try
          set allReminders to allReminders & {rId & "|||" & rName & "|||" & rCompleted & "|||" & rDue & "|||" & rBody & "|||" & listTitle}
        end repeat
      end repeat
      set AppleScript's text item delimiters to "~~~"
      set result to allReminders as string
      set AppleScript's text item delimiters to ""
      return result
    end tell
  `
  return runAppleScript(script)
}

export async function toggleReminder(reminderId: string, listName: string): Promise<void> {
  const script = `
    tell application "Reminders"
      set rl to list "${listName}"
      set targetReminder to first reminder in rl whose id is "${reminderId}"
      set completed of targetReminder to not (completed of targetReminder)
    end tell
  `
  await runAppleScript(script)
}

export async function addReminder(name: string, listName = 'Reminders', dueDate?: string): Promise<void> {
  const dueDatePart = dueDate ? `set due date of newReminder to date "${dueDate}"` : ''
  const script = `
    tell application "Reminders"
      set rl to list "${listName}"
      set newReminder to make new reminder at end of reminders of rl with properties {name:"${name.replace(/"/g, '\\"')}"}
      ${dueDatePart}
    end tell
  `
  await runAppleScript(script)
}

// ─── Apple Notes ─────────────────────────────────────────────────────────────

export async function fetchNotes(count = 20): Promise<string> {
  const script = `
    tell application "Notes"
      set allNotes to {}
      set noteList to notes of default account
      if (count of noteList) > ${count} then
        set noteList to items 1 thru ${count} of noteList
      end if
      repeat with n in noteList
        set nId to id of n
        set nName to name of n
        set nCreated to creation date of n as string
        set nModified to modification date of n as string
        try
          set nBody to body of n
          if (length of nBody) > 500 then
            set nBody to (characters 1 thru 500 of nBody) as string
          end if
        on error
          set nBody to ""
        end try
        try
          set nFolder to name of container of n
        on error
          set nFolder to "Notes"
        end try
        set allNotes to allNotes & {nId & "|||" & nName & "|||" & nCreated & "|||" & nModified & "|||" & nFolder & "|||" & nBody}
      end repeat
      set AppleScript's text item delimiters to "~~~"
      set result to allNotes as string
      set AppleScript's text item delimiters to ""
      return result
    end tell
  `
  return runAppleScript(script)
}

export async function createNote(name: string, body: string, folder?: string): Promise<void> {
  const folderPart = folder ? `make new folder with properties {name:"${folder}"}` : ''
  const script = `
    tell application "Notes"
      ${folderPart}
      make new note with properties {name:"${name.replace(/"/g, '\\"')}", body:"${body.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"}
    end tell
  `
  await runAppleScript(script)
}
