if(NOT TARGET fbjni::fbjni)
add_library(fbjni::fbjni SHARED IMPORTED)
set_target_properties(fbjni::fbjni PROPERTIES
    IMPORTED_LOCATION "C:/Users/Jaideep/.gradle/caches/8.12/transforms/3e2f48421762568dca8b23a901c4b600/transformed/fbjni-0.7.0/prefab/modules/fbjni/libs/android.armeabi-v7a/libfbjni.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/Jaideep/.gradle/caches/8.12/transforms/3e2f48421762568dca8b23a901c4b600/transformed/fbjni-0.7.0/prefab/modules/fbjni/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

