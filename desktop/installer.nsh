!macro customInstall
  CreateShortCut "$DESKTOP\Moscovium Calculator.lnk" "$INSTDIR\Moscovium Calculator.exe" "" "$INSTDIR\resources\Calc.ico" 0 SW_SHOWNORMAL "" "Moscovium Calculator"
  CreateShortCut "$SMPROGRAMS\Moscovium Calculator.lnk" "$INSTDIR\Moscovium Calculator.exe" "" "$INSTDIR\resources\Calc.ico" 0 SW_SHOWNORMAL "" "Moscovium Calculator"
!macroend

!macro customUnInstall
  Delete "$DESKTOP\Moscovium Calculator.lnk"
  Delete "$SMPROGRAMS\Moscovium Calculator.lnk"
!macroend
