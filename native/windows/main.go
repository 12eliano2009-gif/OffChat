package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
)

// Packed origin is a fixed-width field so the download API can patch the
// start URL without changing the PE size.
var packedOrigin = "@@OFFCHAT_ORIGIN_BEG@@https://offchat.invalid/pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad-pad@@OFFCHAT_ORIGIN_END@@"

func origin() string {
	raw := packedOrigin
	const beg = "@@OFFCHAT_ORIGIN_BEG@@"
	const end = "@@OFFCHAT_ORIGIN_END@@"
	if i := strings.Index(raw, beg); i >= 0 {
		raw = raw[i+len(beg):]
	}
	if i := strings.Index(raw, end); i >= 0 {
		raw = raw[:i]
	}
	u := strings.TrimSpace(strings.TrimRight(raw, "/"))
	if u == "" || strings.Contains(u, "offchat.invalid") {
		if exe, err := os.Executable(); err == nil {
			if b, err := os.ReadFile(filepath.Join(filepath.Dir(exe), "origin.txt")); err == nil {
				u = strings.TrimSpace(string(b))
			}
		}
	}
	if u != "" && !strings.Contains(u, "://") {
		u = "https://" + u
	}
	if u == "" {
		u = "https://offchat.app"
	}
	return u
}

func exists(p string) bool {
	st, err := os.Stat(p)
	return err == nil && !st.IsDir()
}

func main() {
	url := origin()
	profile := filepath.Join(os.TempDir(), "offchat-chromium")
	local := os.Getenv("LOCALAPPDATA")
	pf := os.Getenv("ProgramFiles")
	pfx := os.Getenv("ProgramFiles(x86)")
	browsers := []string{
		filepath.Join(pf, `Microsoft\Edge\Application\msedge.exe`),
		filepath.Join(pfx, `Microsoft\Edge\Application\msedge.exe`),
		filepath.Join(local, `Microsoft\Edge\Application\msedge.exe`),
		filepath.Join(pf, `Google\Chrome\Application\chrome.exe`),
		filepath.Join(pfx, `Google\Chrome\Application\chrome.exe`),
		filepath.Join(local, `Google\Chrome\Application\chrome.exe`),
	}
	args := []string{
		"--app=" + url,
		"--user-data-dir=" + profile,
		"--no-first-run",
		"--no-default-browser-check",
		"--disable-features=Translate,NotificationTriggers",
	}
	for _, b := range browsers {
		if b == "" || strings.HasSuffix(b, `\msedge.exe`) && !exists(b) {
			if !exists(b) {
				continue
			}
		}
		if !exists(b) {
			continue
		}
		cmd := exec.Command(b, args...)
		cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
		if err := cmd.Start(); err == nil {
			return
		}
	}
	cmd := exec.Command("cmd", "/c", "start", "", url)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	_ = cmd.Run()
}
