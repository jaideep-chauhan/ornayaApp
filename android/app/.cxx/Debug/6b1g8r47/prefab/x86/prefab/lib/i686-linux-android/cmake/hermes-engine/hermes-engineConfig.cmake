if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "C:/Users/Jaideep/.gradle/caches/8.12/transforms/2dab15c7fa2ee4d29020ce49784e5fb7/transformed/hermes-android-0.78.1-debug/prefab/modules/libhermes/libs/android.x86/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/Jaideep/.gradle/caches/8.12/transforms/2dab15c7fa2ee4d29020ce49784e5fb7/transformed/hermes-android-0.78.1-debug/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

