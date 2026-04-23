package com.mobile

import android.Manifest
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.twiliovoicereactnative.VoiceActivityProxy

class MainActivity : ReactActivity() {

  private val activityProxy =
      VoiceActivityProxy(this) { permission: String ->
        when {
          Manifest.permission.RECORD_AUDIO == permission ->
              Toast.makeText(
                      this,
                      "Se necesita permiso de micrófono para las llamadas.",
                      Toast.LENGTH_LONG,
                  )
                  .show()
          Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
              Manifest.permission.BLUETOOTH_CONNECT == permission ->
              Toast.makeText(
                      this,
                      "Se necesita Bluetooth para auriculares en llamadas.",
                      Toast.LENGTH_LONG,
                  )
                  .show()
          Build.VERSION.SDK_INT > Build.VERSION_CODES.S_V2 &&
              Manifest.permission.POST_NOTIFICATIONS == permission ->
              Toast.makeText(
                      this,
                      "Se necesitan notificaciones para llamadas entrantes.",
                      Toast.LENGTH_LONG,
                  )
                  .show()
          else -> Unit
        }
      }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "mobile"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    activityProxy.onCreate(savedInstanceState)
  }

  override fun onDestroy() {
    activityProxy.onDestroy()
    super.onDestroy()
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    activityProxy.onNewIntent(intent)
  }
}
