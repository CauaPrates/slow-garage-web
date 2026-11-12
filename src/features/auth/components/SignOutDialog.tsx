import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type SignOutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  /** Volta do foco ao fechar (Configurações usa `useReturnFocus`; o menu do perfil devolve ao avatar por conta própria). */
  onCloseAutoFocus?: (event: Event) => void;
};

/**
 * Confirmação de "Sair" — usada pelo menu do perfil e por Configurações.
 *
 * Etapa 14: o texto diz o efeito real. `signOut()` usa o escopo padrão do
 * Supabase (`global`, conferido na chamada `POST /logout?scope=global`): a
 * sessão termina neste aparelho e nos outros em que a conta entrou — não "só
 * neste dispositivo", como Configurações dizia.
 */
export function SignOutDialog({ open, onOpenChange, onConfirm, onCloseAutoFocus }: SignOutDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>Sair da conta?</AlertDialogTitle>
          <AlertDialogDescription>
            A sessão termina neste aparelho e nos outros em que você entrou com esta conta. Para voltar à garagem, entre
            de novo com e-mail e senha. Nada da garagem é apagado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Sair</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
