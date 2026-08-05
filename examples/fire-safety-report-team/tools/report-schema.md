# generate-report.mjs 입력 스키마

`node generate-report.mjs --input <spec.json> --output <file.docx>` 형태로 실행한다.
`spec.json`은 아래 구조를 따른다.

```jsonc
{
  "date": "2026. 8. 5.(수)",        // 보고일자 (표지 우측 상단)
  "department": "기술기준부(기술기준팀)", // 보고부서
  "subtitle": "부제 -",              // 선택. 제목 위 작은 줄. 끝에 " -" 포함해서 작성
  "title": "보고서 제목",             // 민트색 박스 안에 굵게 표시됨

  "sections": [
    {
      "heading": "민원개요",          // □ 대분류 제목
      "blocks": [
        { "type": "bullet", "level": 1, "text": "○ 로 표시되는 핵심 항목" },
        { "type": "bullet", "level": 2, "text": "- 로 표시되는 세부 항목" },
        { "type": "bullet", "level": 3, "text": "* 로 표시되는 각주성 보충설명 (작은 글씨)" },
        { "type": "text", "text": "들여쓰기 없는 일반 문단" },
        {
          "type": "table",
          "headers": ["구분", "내용", "비고"],
          "rows": [["1", "...", "..."]]
        }
      ]
    }
  ],

  "footnotes": ["1) 용어 설명 등 문서 하단 각주"],

  "attachments": [
    {
      "title": "붙임1 참고자료",       // 새 페이지에서 시작, □ 형태로 표시
      "blocks": [ /* sections[].blocks 와 동일한 형식 */ ]
    }
  ]
}
```

## 규칙
- `blocks`의 `level`은 1~3만 사용한다 (○/-/* 3단계).
- 표(`table`)는 헤더 행 회색 음영이 자동 적용된다.
- `attachments`는 각각 페이지를 새로 시작한다.
- 실제 조직 로고/직인은 포함하지 않는다 (일반 양식).
