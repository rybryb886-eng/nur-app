import { Link } from 'expo-router';
import { View } from 'react-native';

import { Sky, Txt } from '@/components/ui';

export default function NotFoundScreen() {
  return (
    <Sky>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Txt size={20} weight="bold">
          404
        </Txt>
        <Link href="/">
          <Txt weight="semibold">← Нұр</Txt>
        </Link>
      </View>
    </Sky>
  );
}
